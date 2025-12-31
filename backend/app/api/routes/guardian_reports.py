from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.services.guardian_reports_service import GuardianReportsService
from app.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY


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


@router.post("/guardian-reports/generate", response_model=GuardianReportGenerationResponse, tags=["guardian-reports"])
async def generate_guardian_report(
    child_uid: str = Query(..., description="Child user ID to generate report for"),
    report_type: str = Query("weekly", description="Type of report: 'weekly' or 'monthly'")
):
    """
    Generate a guardian report for a specific child.
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=500, detail="Supabase configuration not found")
    
    if report_type not in ['weekly', 'monthly']:
        raise HTTPException(status_code=400, detail="Report type must be 'weekly' or 'monthly'")
    
    try:
        # Initialize guardian reports service
        guardian_reports_service = GuardianReportsService(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        
        # Generate the report
        report_payload = await guardian_reports_service.generate_guardian_report(child_uid, report_type)
        
        # Get guardian email for the child
        guardians = await guardian_reports_service.get_guardians_for_report(report_type)
        guardian = next((g for g in guardians if g['child_uid'] == child_uid), None)
        
        if not guardian:
            raise HTTPException(status_code=404, detail=f"No guardian found for child {child_uid}")
        
        # Calculate period dates
        now = datetime.now()
        days_back = 7 if report_type == 'weekly' else 30
        period_start = now - timedelta(days=days_back)
        
        # Save the report to the database
        saved_report = await guardian_reports_service.save_guardian_report(
            child_uid, guardian['email'], report_type, report_payload, period_start, now
        )
        
        if saved_report:
            return GuardianReportGenerationResponse(
                message=f"{report_type.title()} guardian report generated successfully for child {child_uid}",
                report_id=saved_report.get('id'),
                child_uid=child_uid,
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


@router.get("/guardian-reports", tags=["guardian-reports"])
async def get_guardian_reports(
    child_uid: Optional[str] = Query(None, description="Filter by child user ID"),
    guardian_email: Optional[str] = Query(None, description="Filter by guardian email"),
    report_type: Optional[str] = Query(None, description="Filter by report type: 'weekly' or 'monthly'"),
    sent: Optional[bool] = Query(None, description="Filter by sent status")
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
        
        if child_uid:
            query = query.eq("child_uid", child_uid)
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


@router.post("/guardian-reports/batch-generate", tags=["guardian-reports"])
async def batch_generate_guardian_reports(
    report_type: str = Query(..., description="Type of report: 'weekly' or 'monthly'")
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
        
        # Get all guardians who want this report type
        guardians = await guardian_reports_service.get_guardians_for_report(report_type)
        
        results = []
        processed_count = 0
        
        for guardian in guardians:
            try:
                # Generate the report for each child
                report_payload = await guardian_reports_service.generate_guardian_report(
                    guardian['child_uid'], report_type
                )
                
                # Calculate period dates
                now = datetime.now()
                days_back = 7 if report_type == 'weekly' else 30
                period_start = now - timedelta(days=days_back)
                
                # Save the report to the database
                saved_report = await guardian_reports_service.save_guardian_report(
                    guardian['child_uid'], guardian['email'], report_type, 
                    report_payload, period_start, now
                )
                
                if saved_report:
                    results.append({
                        "child_uid": guardian['child_uid'],
                        "guardian_email": guardian['email'],
                        "status": "success",
                        "report_id": saved_report.get('id')
                    })
                    processed_count += 1
                else:
                    results.append({
                        "child_uid": guardian['child_uid'],
                        "guardian_email": guardian['email'],
                        "status": "failed",
                        "error": "Failed to save report"
                    })
            except Exception as e:
                results.append({
                    "child_uid": guardian['child_uid'],
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
