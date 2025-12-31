from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging
from supabase import Client
from app.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
from supabase import create_client


logger = logging.getLogger(__name__)


class ReportsService:
    """Service for generating weekly and monthly reports for Lana AI users."""

    def __init__(self, supabase_url: str, supabase_key: str):
        """Initialize with Supabase client."""
        self.client: Client = create_client(supabase_url, supabase_key)

    async def get_weekly_report(self, user_id: str, start_date: Optional[datetime] = None) -> Dict[str, Any]:
        """Generate a weekly report for a user."""
        if start_date is None:
            # Default to the start of this week (Monday)
            today = datetime.now()
            start_date = today - timedelta(days=today.weekday())
        
        # Calculate end date (end of the week)
        end_date = start_date + timedelta(days=6)
        
        return await self._generate_report(user_id, start_date, end_date, "weekly")

    async def get_monthly_report(self, user_id: str, start_date: Optional[datetime] = None) -> Dict[str, Any]:
        """Generate a monthly report for a user."""
        if start_date is None:
            # Default to the start of this month
            today = datetime.now()
            start_date = today.replace(day=1)
        
        # Calculate end date (end of the month)
        if start_date.month == 12:
            end_date = start_date.replace(year=start_date.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_date = start_date.replace(month=start_date.month + 1, day=1) - timedelta(days=1)
        
        return await self._generate_report(user_id, start_date, end_date, "monthly")

    async def _generate_report(self, user_id: str, start_date: datetime, end_date: datetime, report_type: str) -> Dict[str, Any]:
        """Generate a report for a specific date range."""
        try:
            # Get lesson data from searches table
            lesson_data = await self._get_lesson_data(user_id, start_date, end_date)
            
            # Get user activity data from user_events table
            activity_data = await self._get_activity_data(user_id, start_date, end_date)
            
            # Get engagement metrics
            engagement_metrics = await self._get_engagement_metrics(user_id, start_date, end_date)
            
            # Calculate summary statistics
            total_lessons = len(lesson_data)
            total_activity_events = len(activity_data)
            
            # Determine most active days
            active_days = self._get_active_days(activity_data)
            
            # Get top performing topics
            top_topics = self._get_top_topics(lesson_data)
            
            # Calculate completion rates
            completion_rate = self._calculate_completion_rate(lesson_data)
            
            report = {
                "user_id": user_id,
                "report_type": report_type,
                "date_range": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat()
                },
                "summary": {
                    "total_lessons_completed": total_lessons,
                    "total_activity_events": total_activity_events,
                    "engagement_score": engagement_metrics.get("engagement_score", 0),
                    "completion_rate": completion_rate
                },
                "lessons": {
                    "total": total_lessons,
                    "by_topic": top_topics,
                    "by_date": self._organize_lessons_by_date(lesson_data)
                },
                "activity": {
                    "total_events": total_activity_events,
                    "by_type": self._organize_activity_by_type(activity_data),
                    "by_day": active_days
                },
                "engagement": engagement_metrics,
                "recommendations": self._generate_recommendations(
                    engagement_metrics, top_topics, completion_rate
                ),
                "generated_at": datetime.now().isoformat()
            }
            
            return report
            
        except Exception as e:
            logger.error(f"Error generating {report_type} report for user {user_id}: {e}")
            raise

    async def _get_lesson_data(self, user_id: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get lesson data from the searches table."""
        try:
            result = (
                self.client.table("searches")
                .select("*")
                .eq("uid", user_id)
                .gte("created_at", start_date.isoformat())
                .lte("created_at", end_date.isoformat())
                .order("created_at", desc=True)
                .execute()
            )
            return result.data or []
        except Exception as e:
            logger.error(f"Error fetching lesson data: {e}")
            return []

    async def _get_activity_data(self, user_id: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get activity data from the user_events table."""
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
            logger.error(f"Error fetching activity data: {e}")
            return []

    async def _get_engagement_metrics(self, user_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Calculate engagement metrics."""
        try:
            # Get distinct days of activity
            activity_result = (
                self.client.table("user_events")
                .select("timestamp")
                .eq("user_id", user_id)
                .gte("timestamp", start_date.isoformat())
                .lte("timestamp", end_date.isoformat())
                .execute()
            )
            
            activity_data = activity_result.data or []
            
            if not activity_data:
                return {
                    "engagement_score": 0,
                    "active_days": 0,
                    "avg_daily_sessions": 0,
                    "most_active_time": None
                }
            
            # Calculate distinct active days
            active_days = set()
            for event in activity_data:
                timestamp = datetime.fromisoformat(event['timestamp'].replace('Z', '+00:00'))
                day_key = timestamp.date().isoformat()
                active_days.add(day_key)
            
            # Calculate engagement score based on activity count and consistency
            total_events = len(activity_data)
            active_days_count = len(active_days)
            avg_daily_events = total_events / active_days_count if active_days_count > 0 else 0
            
            # Engagement score (0-100) based on activity and consistency
            activity_score = min(50, total_events * 2)  # Up to 50 points for activity
            consistency_score = min(50, (active_days_count * 10))  # Up to 50 points for consistency
            engagement_score = min(100, activity_score + consistency_score)
            
            return {
                "engagement_score": engagement_score,
                "active_days": active_days_count,
                "total_events": total_events,
                "avg_daily_events": avg_daily_events
            }
        except Exception as e:
            logger.error(f"Error calculating engagement metrics: {e}")
            return {
                "engagement_score": 0,
                "active_days": 0,
                "avg_daily_sessions": 0,
                "most_active_time": None
            }

    def _get_active_days(self, activity_data: List[Dict[str, Any]]) -> Dict[str, int]:
        """Organize activity by day."""
        active_days = {}
        for event in activity_data:
            if 'timestamp' in event:
                timestamp = datetime.fromisoformat(event['timestamp'].replace('Z', '+00:00'))
                day_key = timestamp.date().isoformat()
                active_days[day_key] = active_days.get(day_key, 0) + 1
        return active_days

    def _get_top_topics(self, lesson_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Get top topics by frequency."""
        topic_counts = {}
        for lesson in lesson_data:
            title = lesson.get('title', 'Unknown')
            topic_counts[title] = topic_counts.get(title, 0) + 1
        
        # Sort by count and return top 10
        sorted_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)
        return [{"topic": topic, "count": count} for topic, count in sorted_topics[:10]]

    def _organize_lessons_by_date(self, lesson_data: List[Dict[str, Any]]) -> Dict[str, int]:
        """Organize lessons by date."""
        lessons_by_date = {}
        for lesson in lesson_data:
            if 'created_at' in lesson:
                timestamp = datetime.fromisoformat(lesson['created_at'].replace('Z', '+00:00'))
                date_key = timestamp.date().isoformat()
                lessons_by_date[date_key] = lessons_by_date.get(date_key, 0) + 1
        return lessons_by_date

    def _organize_activity_by_type(self, activity_data: List[Dict[str, Any]]) -> Dict[str, int]:
        """Organize activity by event type."""
        activity_by_type = {}
        for event in activity_data:
            event_type = event.get('event_type', 'unknown')
            activity_by_type[event_type] = activity_by_type.get(event_type, 0) + 1
        return activity_by_type

    def _calculate_completion_rate(self, lesson_data: List[Dict[str, Any]]) -> float:
        """Calculate lesson completion rate."""
        # This would be more complex in a real implementation
        # For now, we'll just return a placeholder based on the amount of data
        if not lesson_data:
            return 0.0
        
        # Assuming that having lesson data indicates completion
        # In a real implementation, you might have a specific field indicating completion
        return 100.0

    def _generate_recommendations(self, engagement_metrics: Dict[str, Any], top_topics: List[Dict[str, Any]], completion_rate: float) -> List[str]:
        """Generate personalized recommendations based on the data."""
        recommendations = []
        
        # Engagement-based recommendations
        engagement_score = engagement_metrics.get('engagement_score', 0)
        if engagement_score < 30:
            recommendations.append("Try to engage with the platform more regularly to see better results")
        elif engagement_score < 70:
            recommendations.append("Consider increasing your study frequency for better progress")
        else:
            recommendations.append("Great job maintaining consistent engagement!")
        
        # Topic-based recommendations
        if top_topics:
            most_studied = top_topics[0]['topic'] if top_topics else None
            recommendations.append(f"You're focusing well on {most_studied}. Consider exploring related topics.")
        
        # Completion rate recommendations
        if completion_rate < 80:
            recommendations.append("Try to complete all lessons you start for better retention")
        
        # Activity pattern recommendations
        active_days = engagement_metrics.get('active_days', 0)
        if active_days < 3:
            recommendations.append("Try to study on more days of the week for consistent learning")
        
        return recommendations