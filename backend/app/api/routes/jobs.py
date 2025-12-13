from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional
import logging
from bullmq import Job
from app.jobs.queue_config import get_redis_connection, get_monthly_report_queue
from app.api.dependencies.auth import get_current_user, CurrentUser
from app.middleware.rate_limiter import rate_limit
from app.middleware.security_logger import log_unauthorized_access, log_admin_action

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jobs", tags=["jobs"])

class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: Optional[int] = None
    result: Optional[dict] = None
    failed_reason: Optional[str] = None

class JobCreationResponse(BaseModel):
    job_id: str
    status: str
    message: str

@router.get("/{job_id}/status", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Get the status of a job."""
    try:
        redis_connection = get_redis_connection()
        
        # Try to get the job from lesson queue first
        job = await Job.fromId(redis_connection, job_id)
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )
            
        # Get job state
        state = await job.getState()
        
        response = JobStatusResponse(
            job_id=job_id,
            status=state
        )
        
        # Add progress if available
        if hasattr(job, 'progress') and job.progress:
            response.progress = job.progress
            
        # Add result if completed
        if state == "completed":
            response.result = job.returnvalue
            
        # Add failure reason if failed
        if state == "failed":
            response.failed_reason = str(job.failedReason) if job.failedReason else "Job failed"
            
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting job status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get job status"
        )

@router.post("/monthly-reports", response_model=JobCreationResponse)
@rate_limit(max_requests=5, window_seconds=3600)  # Allow 5 requests per hour per user
async def trigger_monthly_reports(
    current_user: CurrentUser = Depends(get_current_user)
):
    """Trigger the monthly reports generation job. Restricted to admin users only."""
    try:
        # Check if user is admin
        # In production, this should check against a database of admin users
        # For now, we'll check for a specific admin email
        admin_emails = ["contact@lanamind.com"]
        if current_user.email not in admin_emails:
            logger.warning(f"Unauthorized access attempt to monthly reports by user {current_user.id} ({current_user.email})")
            
            # Log security event
            log_unauthorized_access(
                user_id=current_user.id,
                user_email=current_user.email,
                attempted_action="trigger_monthly_reports",
                resource="/api/jobs/monthly-reports"
            )
            
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Administrator privileges required."
            )
        
        # Log admin action
        log_admin_action(
            action="trigger_monthly_reports",
            user_id=current_user.id,
            user_email=current_user.email
        )
        
        redis_connection = get_redis_connection()
        monthly_report_queue = get_monthly_report_queue()
        
        # Add job to queue
        job = await monthly_report_queue.add("monthly-report-generation", {
            "triggered_by": current_user.id,
            "triggered_by_email": current_user.email,
            "timestamp": "2023-01-01T00:00:00Z"  # Placeholder timestamp
        })
        
        logger.info(f"Monthly report job queued with ID: {job.id} by admin user {current_user.email}")
        
        return JobCreationResponse(
            job_id=job.id,
            status="queued",
            message="Monthly report generation job has been queued successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error queuing monthly report job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to queue monthly report job"
        )