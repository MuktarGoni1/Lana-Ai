import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // Check if user is authenticated and has pro status
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please log in to access reports' },
        { status: 401 }
      );
    }
    
    // Check if user is pro
    const isPro = Boolean(session.user.user_metadata?.is_pro || session.user.user_metadata?.pro);
    
    if (!isPro) {
      return NextResponse.json(
        { 
          error: 'Payment Required', 
          message: 'Upgrade to Pro to access detailed performance reports' 
        },
        { status: 402 } // Payment Required
      );
    }
    
    // Mock performance report data for pro users
    const mockReportData = {
      id: 'report_' + Date.now(),
      userId: session.user.id,
      period: 'monthly',
      generatedAt: new Date().toISOString(),
      summary: {
        totalHours: 24.5,
        topicsCovered: 18,
        masteryLevel: 78,
        improvementScore: 15
      },
      detailedMetrics: {
        subjectBreakdown: [
          { subject: 'Mathematics', mastery: 85, hours: 8.5 },
          { subject: 'Science', mastery: 72, hours: 7.2 },
          { subject: 'English', mastery: 81, hours: 8.8 }
        ],
        weeklyProgress: [
          { week: 'Week 1', progress: 65 },
          { week: 'Week 2', progress: 70 },
          { week: 'Week 3', progress: 75 },
          { week: 'Week 4', progress: 78 }
        ],
        strengths: ['Algebra', 'Geometry', 'Reading Comprehension'],
        areasForImprovement: ['Fractions', 'Vocabulary', 'Writing']
      },
      recommendations: [
        'Focus on fraction concepts for the next 2 weeks',
        'Practice vocabulary exercises daily',
        'Schedule writing sessions 3 times per week'
      ]
    };
    
    return NextResponse.json(mockReportData);
  } catch (error) {
    console.error('Error generating performance report:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Could not generate report' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Check if user is authenticated and has pro status
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please log in to access reports' },
        { status: 401 }
      );
    }
    
    // Check if user is pro
    const isPro = Boolean(session.user.user_metadata?.is_pro || session.user.user_metadata?.pro);
    
    if (!isPro) {
      return NextResponse.json(
        { 
          error: 'Payment Required', 
          message: 'Upgrade to Pro to generate performance reports' 
        },
        { status: 402 } // Payment Required
      );
    }
    
    // Parse request body
    const requestBody = await request.json();
    const { period = 'monthly', childId } = requestBody;
    
    // Mock report generation
    const mockReportData = {
      id: 'report_' + Date.now(),
      userId: session.user.id,
      childId: childId || session.user.id,
      period: period,
      generatedAt: new Date().toISOString(),
      summary: {
        totalHours: Math.floor(Math.random() * 30) + 10, // Random between 10-40
        topicsCovered: Math.floor(Math.random() * 20) + 5, // Random between 5-25
        masteryLevel: Math.floor(Math.random() * 40) + 60, // Random between 60-100
        improvementScore: Math.floor(Math.random() * 30) + 5 // Random between 5-35
      },
      detailedMetrics: {
        subjectBreakdown: [
          { subject: 'Mathematics', mastery: Math.floor(Math.random() * 40) + 60, hours: parseFloat((Math.random() * 10 + 5).toFixed(1)) },
          { subject: 'Science', mastery: Math.floor(Math.random() * 40) + 60, hours: parseFloat((Math.random() * 10 + 5).toFixed(1)) },
          { subject: 'English', mastery: Math.floor(Math.random() * 40) + 60, hours: parseFloat((Math.random() * 10 + 5).toFixed(1)) }
        ],
        weeklyProgress: [
          { week: 'Week 1', progress: Math.floor(Math.random() * 40) + 50 },
          { week: 'Week 2', progress: Math.floor(Math.random() * 40) + 55 },
          { week: 'Week 3', progress: Math.floor(Math.random() * 40) + 60 },
          { week: 'Week 4', progress: Math.floor(Math.random() * 40) + 65 }
        ],
        strengths: ['Problem Solving', 'Critical Thinking', 'Analysis'],
        areasForImprovement: ['Attention to Detail', 'Time Management', 'Organization']
      },
      recommendations: [
        'Continue practicing weak areas consistently',
        'Set aside dedicated time for review sessions',
        'Consider additional resources for challenging topics'
      ]
    };
    
    return NextResponse.json(mockReportData);
  } catch (error) {
    console.error('Error generating performance report:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Could not generate report' },
      { status: 500 }
    );
  }
}