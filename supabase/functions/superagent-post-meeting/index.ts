import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Post-Meeting Analyst Superagent
 * Takes a meeting transcript and generates structured analysis:
 * summary, action items, key decisions, sentiment, and follow-ups.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { meetingId } = await req.json();
    if (!meetingId) throw new Error("meetingId is required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch meeting with transcript
    const { data: meeting, error: mErr } = await supabase
      .from("meetings")
      .select("*, organisations(name), projects(name)")
      .eq("id", meetingId)
      .single();
    if (mErr) throw mErr;

    const transcript = meeting.transcript || meeting.notes;
    if (!transcript) throw new Error("No transcript or notes available for analysis");

    // Call AI for analysis
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("No AI API key configured");

    const systemPrompt = `You are NQI Hub's Post-Meeting Analyst. Analyse the meeting transcript/notes and return a JSON object with:
- summary: 2-3 sentence overview
- action_items: array of { task: string, assignee: string | null, deadline: string | null }
- key_decisions: array of strings
- sentiment: "positive" | "neutral" | "mixed" | "negative"
- follow_ups: array of strings (suggested next steps)
- risk_flags: array of strings (any concerns raised)
Return ONLY valid JSON, no markdown.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Meeting: ${meeting.title}\nType: ${meeting.meeting_type}\nOrganisation: ${(meeting as any).organisations?.name || "N/A"}\nProject: ${(meeting as any).projects?.name || "N/A"}\n\nTranscript/Notes:\n${transcript}`,
          },
        ],
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI API error: ${response.status} ${errText}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response (handle possible markdown wrapping)
    let analysis;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysis = JSON.parse(jsonStr);
    } catch {
      analysis = {
        summary: content,
        action_items: [],
        key_decisions: [],
        sentiment: "neutral",
        follow_ups: [],
        risk_flags: [],
      };
    }

    // Save analysis to meeting
    const { error: uErr } = await supabase
      .from("meetings")
      .update({ analysis })
      .eq("id", meetingId);
    if (uErr) throw uErr;

    // Create tasks from action items
    if (analysis.action_items?.length) {
      const tasks = analysis.action_items.map((item: any) => ({
        title: item.task,
        status: "todo",
        priority: "medium",
        project_id: meeting.project_id,
        organisation_id: meeting.organisation_id,
        due_date: item.deadline || null,
      }));

      await supabase.from("tasks").insert(tasks);
    }

    // Log activity
    await supabase.from("activity_log").insert({
      entity_type: "meetings",
      entity_id: meetingId,
      action: "post_meeting_analysis",
      metadata: {
        sentiment: analysis.sentiment,
        action_items_count: analysis.action_items?.length || 0,
        decisions_count: analysis.key_decisions?.length || 0,
      },
    });

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
