import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.41.0";

// Environment variables - using Deno.env.get() as per Supabase Edge Functions standard
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Resend API configuration
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";

interface GuardianReport {
  summary: string;
  strengths: string[];
  challenges: string[];
  engagement_score: number;
  recommended_focus: string;
}

interface GuardianReportRecord {
  id: string;
  child_uid: string;
  guardian_email: string;
  report_type: 'weekly' | 'monthly';
  report_payload: GuardianReport;
  period_start: string;
  period_end: string;
  created_at: string;
}

serve(async (req) => {
  try {
    console.log("Starting guardian report email delivery");
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }

    // Get unsent reports
    const { data: reports, error: reportsError } = await supabase
      .from("guardian_reports")
      .select("*")
      .eq("sent", false);

    if (reportsError) {
      throw new Error(`Error fetching reports: ${reportsError.message}`);
    }

    if (!reports || reports.length === 0) {
      console.log("No unsent reports found");
      return new Response(
        JSON.stringify({ 
          message: "No unsent reports found", 
          processed: 0 
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    let processedCount = 0;
    let failedCount = 0;
    const results: Array<{report_id: string, status: string, error?: string}> = [];

    // Process each report
    for (const report of reports) {
      try {
        console.log(`Processing report for guardian: ${report.guardian_email}`);
        
        // Format the email
        const emailContent = formatReportEmail(report);
        
        // Send the email using Resend
        const emailResult = await sendEmail(
          report.guardian_email,
          `Lana AI - ${report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)} Report for Your Child`,
          emailContent
        );
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (emailResult.success) {
          // Mark the report as sent
          const { error: updateError } = await supabase
            .from("guardian_reports")
            .update({ sent: true, sent_at: new Date().toISOString() })
            .eq("id", report.id);
          
          if (updateError) {
            console.error(`Error updating report ${report.id} as sent:`, updateError);
            results.push({
              report_id: report.id,
              status: 'error',
              error: `Failed to update sent status: ${updateError.message}`
            });
            failedCount++;
          } else {
            processedCount++;
            results.push({
              report_id: report.id,
              status: 'sent'
            });
          }
        } else {
          console.error(`Failed to send email for report ${report.id}:`, emailResult.error);
          results.push({
            report_id: report.id,
            status: 'error',
            error: emailResult.error
          });
          failedCount++;
        }
      } catch (error) {
        console.error(`Error processing report ${report.id}:`, error);
        results.push({
          report_id: report.id,
          status: 'error',
          error: error.message
        });
        failedCount++;
      }
    }

    const summary = {
      total_reports: reports.length,
      sent: processedCount,
      failed: failedCount,
      timestamp: new Date().toISOString(),
      details: results
    };

    console.log(`Guardian report emails completed: ${processedCount} sent, ${failedCount} failed`);
    
    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in guardian report email delivery:", error);
    return new Response(
      JSON.stringify({ error: "Error in guardian report email delivery", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// Function to format the report into an email
function formatReportEmail(report: GuardianReportRecord): string {
  const startDate = new Date(report.period_start).toLocaleDateString();
  const endDate = new Date(report.period_end).toLocaleDateString();
  
  // Create an HTML email template
  const htmlContent = `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #f0f8ff; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .section { margin: 20px 0; }
        .summary { background-color: #f9f9f9; padding: 15px; border-radius: 8px; }
        .strengths { color: #28a745; }
        .challenges { color: #dc3545; }
        .score { font-size: 24px; font-weight: bold; color: #007bff; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Your Child's Learning Report</h1>
        <p>Period: ${startDate} - ${endDate}</p>
      </div>
      
      <div class="content">
        <div class="section">
          <h2>Summary</h2>
          <div class="summary">${report.report_payload.summary}</div>
        </div>
        
        <div class="section">
          <h2>Strengths</h2>
          <ul class="strengths">
            ${report.report_payload.strengths.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>
        
        <div class="section">
          <h2>Challenges</h2>
          <ul class="challenges">
            ${report.report_payload.challenges.map(c => `<li>${c}</li>`).join('')}
          </ul>
        </div>
        
        <div class="section">
          <h2>Engagement Score</h2>
          <div class="score">${(report.report_payload.engagement_score * 100).toFixed(0)}%</div>
          <p>This represents your child's engagement level with the learning platform.</p>
        </div>
        
        <div class="section">
          <h2>Recommended Focus</h2>
          <p>${report.report_payload.recommended_focus}</p>
        </div>
        
        <div class="section" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666;">
          <p>This report was automatically generated by Lana AI. 
          To access more detailed reports or adjust preferences, log in to your parent portal.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return htmlContent;
}

// Function to send email via Resend API
async function sendEmail(to: string, subject: string, html: string): Promise<{success: boolean, error?: string}> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: to,
        subject: subject,
        html: html,
      }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorData = await response.json();
      return { success: false, error: errorData.error || `HTTP ${response.status}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}
