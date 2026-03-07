from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional
import logging
from bullmq import Job
from app.jobs.queue_config import get_lesson_queue, get_tts_queue
from app.api.dependencies.auth import get_current_user, CurrentUser

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jobs", tags=["jobs"])

class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: Optional[int] = None
    result: Optional[dict] = None
    failed_reason: Optional[str] = None

@router.get("/{job_id}/status", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Get the status of a job."""
    try:
        # Look up in lesson queue first, then TTS queue.
        lesson_queue = get_lesson_queue()
        tts_queue = get_tts_queue()

        job = await Job.fromId(lesson_queue, job_id)
        if not job:
            job = await Job.fromId(tts_queue, job_id)
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )

        # Enforce user ownership when job payload includes user_id.
        job_user_id = None
        if hasattr(job, "data") and isinstance(job.data, dict):
            job_user_id = job.data.get("user_id")
        if job_user_id and str(job_user_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
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
