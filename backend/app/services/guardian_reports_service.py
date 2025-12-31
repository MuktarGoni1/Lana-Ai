from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging
from supabase import Client
from app.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
from supabase import create_client
from app.services.reports_service import ReportsService


class GuardianReportsService:
    """Service for generating guardian reports for Lana AI users."""

    def __init__(self, supabase_url: str, supabase_key: str):
        """Initialize with Supabase client."""
        self.client: Client = create_client(supabase_url, supabase_key)
        self.reports_service = ReportsService(supabase_url, supabase_key)

    async def generate_guardian_report(self, child_uid: str, report_type: str = 'weekly') -> Dict[str, Any]:
        """
        Generate a guardian report for a specific child.
        
        Args:
            child_uid: The user ID of the child
            report_type: 'weekly' or 'monthly'
            
        Returns:
            Dictionary containing the structured guardian report
        """
        try:
            # Calculate date range based on report type
            now = datetime.now()
            if report_type == 'weekly':
                days_back = 7
                start_date = now - timedelta(days=days_back)
            else:  # monthly
                days_back = 30
                start_date = now - timedelta(days=days_back)
            
            # Get user events for the child in the specified date range
            user_events = await self._get_user_events(child_uid, start_date, now)
            
            # Get user learning profile
            learning_profile = await self._get_learning_profile(child_uid)
            
            # Generate the report payload
            report_payload = self._generate_report_payload(user_events, learning_profile, report_type)
            
            return report_payload
            
        except Exception as e:
            logging.error(f"Error generating guardian report for child {child_uid}: {e}")
            raise

    async def _get_user_events(self, user_id: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get user events from the user_events table."""
        try:
            result = (
                self.client.table("user_events")
                .select("*")
                .eq("user_id", user_id)
                .gte("timestamp", start_date.isoformat())
                .lte("timestamp", end_date.isoformat())
                .order("timestamp", desc=True)
                .execute()
            )
            return result.data or []
        except Exception as e:
            logging.error(f"Error fetching user events: {e}")
            return []

    async def _get_learning_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user learning profile from the user_learning_profiles table."""
        try:
            result = (
                self.client.table("user_learning_profiles")
                .select("learning_profile")
                .eq("user_id", user_id)
                .single()
                .execute()
            )
            return result.data if result.data else None
        except Exception as e:
            # Handle case where no learning profile exists
            if "PGRST116" in str(e):  # No rows found error
                return None
            logging.error(f"Error fetching learning profile: {e}")
            return None

    def _generate_report_payload(self, user_events: List[Dict[str, Any]], learning_profile: Optional[Dict[str, Any]], report_type: str) -> Dict[str, Any]:
        """
        Generate the structured report payload based on user events and learning profile.
        
        Args:
            user_events: List of user events for the period
            learning_profile: User's learning profile
            report_type: 'weekly' or 'monthly'
            
        Returns:
            Dictionary containing the structured report
        """
        # Analyze user events to extract topics studied, engagement, etc.
        topics_studied = {}
        event_types = {}
        total_events = len(user_events)
        
        # Count different types of events and topics
        for event in user_events:
            # Extract topic from metadata if available
            if event.get('metadata') and event['metadata'].get('topic'):
                topic = event['metadata']['topic']
                topics_studied[topic] = topics_studied.get(topic, 0) + 1
            
            # Count event types
            event_type = event.get('event_type', 'unknown')
            event_types[event_type] = event_types.get(event_type, 0) + 1

        # Determine most studied topics
        sorted_topics = sorted(topics_studied.items(), key=lambda x: x[1], reverse=True)[:5]
        top_topics = [topic for topic, count in sorted_topics]

        # Calculate engagement score (0-1 based on activity)
        engagement_score = 0
        if total_events > 0:
            # Base engagement on number of events and consistency
            expected_events = 14 if report_type == 'weekly' else 60  # Adjust based on expected activity
            engagement_score = min(1.0, total_events / expected_events)
            
            # Factor in positive engagement indicators
            lesson_complete_count = event_types.get('lesson_complete', 0)
            quiz_complete_count = event_types.get('quiz_complete', 0)
            total_completions = lesson_complete_count + quiz_complete_count
            
            if total_completions > 0:
                engagement_score = min(1.0, engagement_score + (total_completions / total_events) * 0.3)

        # Identify strengths and challenges based on events
        strengths = []
        challenges = []

        # Strengths - completed lessons, quiz completions, etc.
        if lesson_complete_count > 0:
            strengths.append(f"{lesson_complete_count} lessons completed")
        
        if quiz_complete_count > 0:
            strengths.append(f"{quiz_complete_count} quizzes completed")

        # Challenges - high page views with low completions might indicate difficulty
        page_views = event_types.get('page_view', 0)
        lesson_starts = event_types.get('lesson_start', 0)
        lesson_completes = event_types.get('lesson_complete', 0)
        
        if lesson_starts > 0 and lesson_completes == 0:
            challenges.append("Started lessons but didn't complete them")
        elif lesson_starts > lesson_completes * 2:
            challenges.append("More lesson starts than completions")

        # Recommended focus based on patterns
        if challenges:
            recommended_focus = "Focus on completing started lessons"
        elif top_topics:
            recommended_focus = f"Continue focus on {top_topics[0] if top_topics else 'current topics'} and explore related topics"
        else:
            recommended_focus = "Continue current learning approach"

        # Summary based on topics studied
        if top_topics:
            summary = f"Focused on {', '.join(top_topics[:3])} and related topics"
        else:
            summary = "Active learning period"

        return {
            "summary": summary,
            "strengths": strengths if strengths else ["Engaged with learning materials"],
            "challenges": challenges if challenges else ["No specific challenges identified"],
            "engagement_score": round(engagement_score, 2),
            "recommended_focus": recommended_focus
        }

    async def get_guardians_for_report(self, report_type: str = 'weekly') -> List[Dict[str, Any]]:
        """
        Get guardians who want reports of the specified type.
        
        Args:
            report_type: 'weekly' or 'monthly'
            
        Returns:
            List of guardian records
        """
        try:
            # Get guardians based on the report type they want
            column_name = f"{report_type}_report" if report_type in ['weekly', 'monthly'] else 'weekly_report'
            result = (
                self.client.table("guardians")
                .select("child_uid, email")
                .eq(column_name, True)
                .execute()
            )
            return result.data or []
        except Exception as e:
            logging.error(f"Error fetching guardians for {report_type} reports: {e}")
            return []

    async def save_guardian_report(self, child_uid: str, guardian_email: str, report_type: str, 
                                 report_payload: Dict[str, Any], period_start: datetime, 
                                 period_end: datetime) -> Optional[Dict[str, Any]]:
        """
        Save the guardian report to the database.
        
        Args:
            child_uid: The user ID of the child
            guardian_email: The email of the guardian
            report_type: 'weekly' or 'monthly'
            report_payload: The structured report payload
            period_start: Start date of the reporting period
            period_end: End date of the reporting period
            
        Returns:
            The saved report record or None if failed
        """
        try:
            result = (
                self.client.table("guardian_reports")
                .insert({
                    "child_uid": child_uid,
                    "guardian_email": guardian_email,
                    "report_type": report_type,
                    "report_payload": report_payload,
                    "period_start": period_start.date().isoformat(),
                    "period_end": period_end.date().isoformat(),
                    "sent": False
                })
                .select()
                .single()
                .execute()
            )
            return result.data
        except Exception as e:
            logging.error(f"Error saving guardian report for child {child_uid}: {e}")
            return None
