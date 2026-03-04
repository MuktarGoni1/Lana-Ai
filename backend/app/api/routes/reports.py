from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from app.services.reports_service import ReportsService
from app.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
from app.api.dependencies.auth import CurrentUser, get_current_user


router = APIRouter()


class ReportResponse(BaseModel):
    """Response model for reports."""
    user_id: str
    report_type: str
    date_range: dict
    summary: dict
    lessons: dict
    activity: dict
    engagement: dict
    recommendations: list
    generated_at: str


@router.get("/weekly", response_model=ReportResponse, tags=["reports"])
async def get_weekly_report(
    user_id: Optional[str] = Query(None, description="User ID to generate report for (must match authenticated user)"),
    start_date: Optional[str] = Query(None, description="Start date in YYYY-MM-DD format"),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Generate a weekly report for a user.
    
    If no start_date is provided, it will default to the start of the current week (Monday).
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=500, detail="Supabase configuration not found")
    
    try:
        # Reports are scoped to the authenticated user.
        target_user_id = user_id or current_user.id
        if target_user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access another user's report")

        # Parse start_date if provided
        start_datetime = None
        if start_date:
            try:
                start_datetime = datetime.fromisoformat(start_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
        
        # Initialize reports service
        reports_service = ReportsService(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        
        # Generate the report
        report = await reports_service.get_weekly_report(target_user_id, start_datetime)
        
        return report
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating weekly report: {str(e)}")


@router.get("/monthly", response_model=ReportResponse, tags=["reports"])
async def get_monthly_report(
    user_id: Optional[str] = Query(None, description="User ID to generate report for (must match authenticated user)"),
    start_date: Optional[str] = Query(None, description="Start date in YYYY-MM-DD format"),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Generate a monthly report for a user.
    
    If no start_date is provided, it will default to the start of the current month.
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=500, detail="Supabase configuration not found")
    
    try:
        # Reports are scoped to the authenticated user.
        target_user_id = user_id or current_user.id
        if target_user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access another user's report")

        # Parse start_date if provided
        start_datetime = None
        if start_date:
            try:
                start_datetime = datetime.fromisoformat(start_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
        
        # Initialize reports service
        reports_service = ReportsService(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        
        # Generate the report
        report = await reports_service.get_monthly_report(target_user_id, start_datetime)
        
        return report
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating monthly report: {str(e)}")


@router.get("/generate", response_model=ReportResponse, tags=["reports"])
async def generate_custom_report(
    user_id: Optional[str] = Query(None, description="User ID for report generation (must match authenticated user)"),
    report_type: str = Query(..., description="Type of report: 'weekly' or 'monthly'"),
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: Optional[str] = Query(None, description="End date in YYYY-MM-DD format (optional)"),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Generate a custom report for a specific date range.
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=500, detail="Supabase configuration not found")
    
    try:
        # Reports are scoped to the authenticated user.
        target_user_id = user_id or current_user.id
        if target_user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access another user's report")

        # Validate report type
        if report_type not in ['weekly', 'monthly']:
            raise HTTPException(status_code=400, detail="Report type must be 'weekly' or 'monthly'")
        
        # Parse start_date
        try:
            start_datetime = datetime.fromisoformat(start_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start date format. Use YYYY-MM-DD.")
        
        # Initialize reports service
        reports_service = ReportsService(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        
        # Generate the appropriate report
        if report_type == 'weekly':
            report = await reports_service.get_weekly_report(target_user_id, start_datetime)
        else:  # monthly
            report = await reports_service.get_monthly_report(target_user_id, start_datetime)
        
        return report
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating custom report: {str(e)}")
