from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from app.services.guardian_reports_service import GuardianReportsService
from app.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
from app.api.dependencies.auth import CurrentUser, get_current_user


router = APIRouter()

class GuardianReportResponse(BaseModel):
    """Response model for guardian reports."""
    child_uid: str
    guardian_email: str
    report_type: str
    report_payload: dict
    period_start: str
    period_end: str
    created_at: str


class GuardianReportRequest(BaseModel):
    """Request model for generating guardian reports."""
    child_uid: str
    report_type: str


class GuardianReportGenerationResponse(BaseModel):
    """Response model for guardian report generation."""
    message: str
    report_id: Optional[str] = None
    child_uid: str
    guardian_email: str
    report_type: str
    processed: bool


@router.post("/generate", response_model=GuardianReportGenerationResponse, tags=["guardian-reports"])
async def generate_guardian_report(
    child_uid: Optional[str] = Query(None, description="User ID to generate report for (must match authenticated user)"),
    report_type: str = Query("weekly", description="Type of report: 'weekly' or 'monthly'"),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Generate a guardian report for a specific child.
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=500, detail="Supabase configuration not found")
    
    if report_type not in ['weekly', 'monthly']:
        raise HTTPException(status_code=400, detail="Report type must be 'weekly' or 'monthly'")
    
    try:
        target_user_id = child_uid or current_user.id
        if target_user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot generate reports for another user")

        # Initialize guardian reports service
        guardian_reports_service = GuardianReportsService(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        
        # Generate the report
        report_payload = await guardian_reports_service.generate_guardian_report(target_user_id, report_type)
        
        # Get guardian email for the user.
        guardians = await guardian_reports_service.get_guardians_for_report(report_type, user_id=target_user_id)
        guardian = next((g for g in guardians if g.get('user_id') == target_user_id), None)
        
        if not guardian:
            raise HTTPException(status_code=404, detail=f"No guardian settings found for user {target_user_id}")
        
        # Calculate period dates
        now = datetime.now()
        days_back = 7 if report_type == 'weekly' else 30
        period_start = now - timedelta(days=days_back)
        
        # Save the report to the database
        saved_report = await guardian_reports_service.save_guardian_report(
            target_user_id, guardian['email'], report_type, report_payload, period_start, now
        )
        
        if saved_report:
            return GuardianReportGenerationResponse(
                message=f"{report_type.title()} guardian report generated successfully for user {target_user_id}",
                report_id=saved_report.get('id'),
                child_uid=target_user_id,
                guardian_email=guardian['email'],
                report_type=report_type,
                processed=True
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to save guardian report")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating guardian report: {str(e)}")


@router.get("/", tags=["guardian-reports"])
async def get_guardian_reports(
    child_uid: Optional[str] = Query(None, description="Filter by user ID (must match authenticated user)"),
    guardian_email: Optional[str] = Query(None, description="Filter by guardian email"),
    report_type: Optional[str] = Query(None, description="Filter by report type: 'weekly' or 'monthly'"),
    sent: Optional[bool] = Query(None, description="Filter by sent status"),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Get guardian reports with optional filters.
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=500, detail="Supabase configuration not found")
    
    try:
        # Initialize guardian reports service
        guardian_reports_service = GuardianReportsService(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        
        # Build query based on filters
        query = guardian_reports_service.client.table("guardian_reports").select("*")
        query = query.eq("user_id", current_user.id)
        
        if child_uid:
            if child_uid != current_user.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access another user's reports")
            query = query.eq("user_id", child_uid)
        if guardian_email:
            query = query.eq("guardian_email", guardian_email)
        if report_type:
            query = query.eq("report_type", report_type)
        if sent is not None:
            query = query.eq("sent", sent)
        
        result = query.order("created_at", desc=True).execute()
        
        return {"reports": result.data or [], "count": len(result.data or [])}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching guardian reports: {str(e)}")


@router.post("/batch-generate", tags=["guardian-reports"])
async def batch_generate_guardian_reports(
    report_type: str = Query(..., description="Type of report: 'weekly' or 'monthly'"),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Batch generate guardian reports for all eligible guardians.
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=500, detail="Supabase configuration not found")
    
    if report_type not in ['weekly', 'monthly']:
        raise HTTPException(status_code=400, detail="Report type must be 'weekly' or 'monthly'")
    
    try:
        # Initialize guardian reports service
        guardian_reports_service = GuardianReportsService(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        
        # Generate only for the authenticated user's guardian settings.
        guardians = await guardian_reports_service.get_guardians_for_report(report_type, user_id=current_user.id)
        
        results = []
        processed_count = 0
        
        for guardian in guardians:
            try:
                # Generate the report for each child
                report_payload = await guardian_reports_service.generate_guardian_report(
                    guardian['user_id'], report_type
                )
                
                # Calculate period dates
                now = datetime.now()
                days_back = 7 if report_type == 'weekly' else 30
                period_start = now - timedelta(days=days_back)
                
                # Save the report to the database
                saved_report = await guardian_reports_service.save_guardian_report(
                    guardian['user_id'], guardian['email'], report_type, 
                    report_payload, period_start, now
                )
                
                if saved_report:
                    results.append({
                        "child_uid": guardian['user_id'],
                        "user_id": guardian['user_id'],
                        "guardian_email": guardian['email'],
                        "status": "success",
                        "report_id": saved_report.get('id')
                    })
                    processed_count += 1
                else:
                    results.append({
                        "child_uid": guardian['user_id'],
                        "user_id": guardian['user_id'],
                        "guardian_email": guardian['email'],
                        "status": "failed",
                        "error": "Failed to save report"
                    })
            except Exception as e:
                results.append({
                    "child_uid": guardian.get('user_id'),
                    "user_id": guardian.get('user_id'),
                    "guardian_email": guardian['email'],
                    "status": "error",
                    "error": str(e)
                })
        
        return {
            "message": f"Batch generation completed for {report_type} reports",
            "total_guardians": len(guardians),
            "processed": processed_count,
            "results": results
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in batch generation: {str(e)}")
