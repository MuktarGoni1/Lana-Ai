import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.41.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

interface GuardianReport {
  summary: string;
  strengths: string[];
  challenges: string[];
  engagement_score: number;
  recommended_focus: string;
}

interface ReportPayload {
  child_uid: string;
  guardian_email: string;
  report_type: 'weekly' | 'monthly';
  report_payload: GuardianReport;
  period_start: string;
  period_end: string;
}

serve(async (req) => {
  try {
    // Parse the request to determine report type
    const url = new URL(req.url);
    const reportType = url.searchParams.get("type") || "weekly"; // Default to weekly
    
    if (!["weekly", "monthly"].includes(reportType)) {
      return new Response(
        JSON.stringify({ error: "Invalid report type. Use 'weekly' or 'monthly'" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting ${reportType} guardian report generation`);
    
    // Calculate date range based on report type
    const now = new Date();
    let daysBack = reportType === 'weekly' ? 7 : 30;
    
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - daysBack);
    
    // Get guardians who want reports
    const { data: guardians, error: guardiansError } = await supabase
      .from("guardians")
      .select("child_uid, email, weekly_report, monthly_report")
      .eq(reportType === 'weekly' ? 'weekly_report' : 'monthly_report', true);

    if (guardiansError) {
      throw new Error(`Error fetching guardians: ${guardiansError.message}`);
    }

    if (!guardians || guardians.length === 0) {
      console.log("No guardians found for reports");
      return new Response(
        JSON.stringify({ 
          message: "No guardians found for reports", 
          report_type: reportType,
          processed: 0 
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    let processedCount = 0;
    const results: Array<{child_uid: string, report_id?: string, status: string, error?: string}> = [];

    // Process each guardian's child
    for (const guardian of guardians) {
      try {
        const childUid = guardian.child_uid;
        const guardianEmail = guardian.email;
        
        console.log(`Processing report for child: ${childUid}`);
        
        // Get user events for the child in the specified date range
        const { data: userEvents, error: eventsError } = await supabase
          .from("user_events")
          .select("*")
          .eq("user_id", childUid)
          .gte("timestamp", startDate.toISOString())
          .lte("timestamp", now.toISOString())
          .order("timestamp", { ascending: false });

        if (eventsError) {
          console.error(`Error fetching events for child ${childUid}:`, eventsError);
          continue;
        }

        // Get user learning profile
        const { data: learningProfile, error: profileError } = await supabase
          .from("user_learning_profiles")
          .select("learning_profile")
          .eq("user_id", childUid)
          .single<{ learning_profile: any | null; }>();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error(`Error fetching learning profile for child ${childUid}:`, profileError);
        }

        // Generate the report summary
        const reportPayload = generateReportPayload(userEvents, learningProfile?.learning_profile || null, reportType);
        
        // Prepare the report record
        const reportRecord: ReportPayload = {
          child_uid: childUid,
          guardian_email: guardianEmail,
          report_type: reportType as 'weekly' | 'monthly',
          report_payload: reportPayload,
          period_start: startDate.toISOString(),
          period_end: now.toISOString()
        };

        // Insert the report into guardian_reports table
        const { data: insertedReport, error: insertError } = await supabase
          .from("guardian_reports")
          .insert([{
            child_uid: childUid,
            guardian_email: guardianEmail,
            report_type: reportType as 'weekly' | 'monthly',
            report_payload: reportPayload,
            period_start: startDate.toISOString(),
            period_end: now.toISOString(),
            sent: false
          }])
          .select()
          .single();

        if (insertError) {
          console.error(`Error inserting report for child ${childUid}:`, insertError);
          results.push({
            child_uid: childUid,
            status: 'error',
            error: insertError.message
          });
        } else {
          processedCount++;
          results.push({
            child_uid: childUid,
            report_id: insertedReport?.id,
            status: 'success'
          });
        }
      } catch (error) {
        console.error(`Error processing child ${guardian.child_uid}:`, error);
        results.push({
          child_uid: guardian.child_uid,
          status: 'error',
          error: error.message
        });
      }
    }

    const summary = {
      report_type: reportType,
      total_guardians: guardians.length,
      processed_reports: processedCount,
      timestamp: new Date().toISOString(),
      details: results
    };

    console.log(`Guardian reports ${reportType} generation completed: ${processedCount} processed`);
    
    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in guardian reports generation:", error);
    return new Response(
      JSON.stringify({ error: "Error in guardian reports generation", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// Function to generate the report payload based on user events and learning profile
function generateReportPayload(userEvents: any[], learningProfile: any, reportType: string): GuardianReport {
  // Analyze user events to extract topics studied, engagement, etc.
  const topicsStudied: Record<string, number> = {};
  const eventTypes: Record<string, number> = {};
  let totalEvents = userEvents.length;
  
  // Count different types of events and topics
  for (const event of userEvents) {
    // Extract topic from metadata if available
    if (event.metadata && event.metadata.topic) {
      const topic = event.metadata.topic;
      topicsStudied[topic] = (topicsStudied[topic] || 0) + 1;
    }
    
    // Count event types
    const eventType = event.event_type;
    eventTypes[eventType] = (eventTypes[eventType] || 0) + 1;
  }

  // Determine most studied topics
  const sortedTopics = Object.entries(topicsStudied)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => topic);

  // Calculate engagement score (0-1 based on activity)
  let engagementScore = 0;
  if (totalEvents > 0) {
    // Base engagement on number of events and consistency
    engagementScore = Math.min(1, totalEvents / (reportType === 'weekly' ? 14 : 60)); // Adjust based on expected activity
    
    // Factor in positive engagement indicators
    const lessonCompleteCount = eventTypes['lesson_complete'] || 0;
    const quizCompleteCount = eventTypes['quiz_complete'] || 0;
    const totalCompletions = lessonCompleteCount + quizCompleteCount;
    
    if (totalCompletions > 0) {
      engagementScore = Math.min(1, engagementScore + (totalCompletions / totalEvents) * 0.3);
    }
  }

  // Identify strengths and challenges based on events
  const strengths: string[] = [];
  const challenges: string[] = [];

  // Strengths - completed lessons, quiz completions, etc.
  if (eventTypes['lesson_complete'] && eventTypes['lesson_complete'] > 0) {
    strengths.push(`${eventTypes['lesson_complete']} lessons completed`);
  }
  
  if (eventTypes['quiz_complete'] && eventTypes['quiz_complete'] > 0) {
    strengths.push(`${eventTypes['quiz_complete']} quizzes completed`);
  }

  // Challenges - high page views with low completions might indicate difficulty
  const pageViews = eventTypes['page_view'] || 0;
  const lessonStarts = eventTypes['lesson_start'] || 0;
  const lessonCompletes = eventTypes['lesson_complete'] || 0;
  
  if (lessonStarts > 0 && lessonCompletes === 0) {
    challenges.push("Started lessons but didn't complete them");
  } else if (lessonStarts > lessonCompletes * 2) {
    challenges.push("More lesson starts than completions");
  }

  // Recommended focus based on patterns
  let recommendedFocus = "Continue current learning approach";
  if (challenges.length > 0) {
    recommendedFocus = "Focus on completing started lessons";
  } else if (topicsStudied && Object.keys(topicsStudied).length > 0) {
    const mostStudiedTopic = Object.keys(topicsStudied).reduce((a, b) => 
      topicsStudied[a] > topicsStudied[b] ? a : b
    );
    recommendedFocus = `Continue focus on ${mostStudiedTopic} and explore related topics`;
  }

  // Summary based on topics studied
  let summary = "Active learning period";
  if (sortedTopics.length > 0) {
    summary = `Focused on ${sortedTopics.slice(0, 3).join(', ')} and related topics`;
  }

  return {
    summary,
    strengths: strengths.length > 0 ? strengths : ["Engaged with learning materials"],
    challenges: challenges.length > 0 ? challenges : ["No specific challenges identified"],
    engagement_score: parseFloat(engagementScore.toFixed(2)),
    recommended_focus: recommendedFocus
  };
}
