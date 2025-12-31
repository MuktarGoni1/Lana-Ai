'use client';

import React, { useState, useEffect } from 'react';
import { ReportData } from '@/lib/reports-api';

interface ReportCardProps {
  userId: string;
  reportType: 'weekly' | 'monthly';
  startDate?: string;
}

const ReportCard: React.FC<ReportCardProps> = ({ userId, reportType, startDate }) => {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In a real implementation, you would call the API function
        // For now, we'll simulate with mock data
        const mockReport: ReportData = {
          user_id: userId,
          report_type: reportType,
          date_range: {
            start: startDate || new Date().toISOString(),
            end: new Date().toISOString(),
          },
          summary: {
            total_lessons_completed: 5,
            total_activity_events: 23,
            engagement_score: 78,
            completion_rate: 90,
          },
          lessons: {
            total: 5,
            by_topic: [
              { topic: 'Algebra Basics', count: 2 },
              { topic: 'Geometry Fundamentals', count: 1 },
              { topic: 'Fractions', count: 2 },
            ],
            by_date: {
              [new Date().toISOString().split('T')[0]]: 3,
              [new Date(Date.now() - 86400000).toISOString().split('T')[0]]: 2,
            },
          },
          activity: {
            total_events: 23,
            by_type: {
              'lesson_start': 5,
              'lesson_complete': 4,
              'quiz_complete': 3,
              'page_view': 11,
            },
            by_day: {
              [new Date().toISOString().split('T')[0]]: 15,
              [new Date(Date.now() - 86400000).toISOString().split('T')[0]]: 8,
            },
          },
          engagement: {
            engagement_score: 78,
            active_days: 4,
            total_events: 23,
            avg_daily_events: 5.75,
          },
          recommendations: [
            'Great job maintaining consistent engagement!',
            'You\'re focusing well on Algebra. Consider exploring related topics.',
            'Try to study on more days of the week for consistent learning.'
          ],
          generated_at: new Date().toISOString(),
        };
        
        setReport(mockReport);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [userId, reportType, startDate]);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <h3 className="text-lg font-semibold text-red-800">Error Loading Report</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <p className="text-gray-600">No report data available</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
          </h2>
          <p className="text-sm text-gray-500">
            {new Date(report.date_range.start).toLocaleDateString()} - {new Date(report.date_range.end).toLocaleDateString()}
          </p>
        </div>
        <span className="text-xs text-gray-500">
          Generated: {new Date(report.generated_at).toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">Lessons Completed</p>
          <p className="text-2xl font-bold text-blue-900">{report.summary.total_lessons_completed}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-800">Activity Events</p>
          <p className="text-2xl font-bold text-green-900">{report.summary.total_activity_events}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-purple-800">Engagement Score</p>
          <p className="text-2xl font-bold text-purple-900">{report.summary.engagement_score}/100</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-800">Completion Rate</p>
          <p className="text-2xl font-bold text-yellow-900">{report.summary.completion_rate}%</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Top Topics</h3>
        <div className="flex flex-wrap gap-2">
          {report.lessons.by_topic.map((topic, index) => (
            <span 
              key={index} 
              className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
            >
              {topic.topic} ({topic.count})
            </span>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Activity by Type</h3>
        <div className="space-y-2">
          {Object.entries(report.activity.by_type).map(([type, count]) => (
            <div key={type} className="flex justify-between">
              <span className="capitalize text-gray-700">{type.replace('_', ' ')}</span>
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Recommendations</h3>
        <ul className="list-disc pl-5 space-y-1">
          {report.recommendations.map((rec, index) => (
            <li key={index} className="text-gray-700">{rec}</li>
          ))}
        </ul>
      </div>

      <div className="text-xs text-gray-500">
        Report generated for user: {report.user_id}
      </div>
    </div>
  );
};

export default ReportCard;