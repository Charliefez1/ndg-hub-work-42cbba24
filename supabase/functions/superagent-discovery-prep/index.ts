import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Discovery Prep Superagent
 * Prepares a brief for an upcoming discovery meeting by gathering
 * all relevant context: org history, past projects, contacts, and AI-suggested talking points.
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

    // Fetch meeting
    const { data: meeting, error: mErr } = await supabase
      .from("meetings")
      .select("*, organisations(name, sector, notes, website), contacts(name, job_title, email)")
      .eq("id", meetingId)
      .single();
    if (mErr) throw mErr;

    const orgId = meeting.organisation_id;
    let contextParts: string[] = [];

    // Gather org context
    const org = (meeting as any).organisations;
    if (org) {
      contextParts.push(`Organisation: ${org.name}`);
      if (org.sector) contextParts.push(`Sector: ${org.sector}`);
      if (org.website) contextParts.push(`Website: ${org.website}`);
      if (org.notes) contextParts.push(`Notes: ${org.notes}`);
    }

    // Past projects
    if (orgId) {
      const { data: projects } = await supabase
        .from("projects")
        .select("name, status, budget, start_date, end_date")
        .eq("organisation_id", orgId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (projects?.length) {
        contextParts.push(`\nPast Projects (${projects.length}):`);
        projects.forEach((p) => {
          contextParts.push(`- ${p.name} [${p.status}]${p.budget ? ` £${p.budget}` : ""}`);
        });
      }

      // Past deliveries
      const { data: deliveries } = await supabase
        .from("deliveries")
        .select("title, status, satisfaction_score, delivery_date")
        .eq("organisation_id", orgId)
        .order("delivery_date", { ascending: false })
        .limit(5);
      if (deliveries?.length) {
        contextParts.push(`\nRecent Deliveries:`);
        deliveries.forEach((d) => {
          contextParts.push(`- ${d.title} [${d.status}]${d.satisfaction_score ? ` CSAT: ${d.satisfaction_score}` : ""}`);
        });
      }

      // Contacts
      const { data: contacts } = await supabase
        .from("contacts")
        .select("name, job_title, email, is_primary")
        .eq("organisation_id", orgId);
      if (contacts?.length) {
        contextParts.push(`\nContacts:`);
        contacts.forEach((c) => {
          contextParts.push(`- ${c.name}${c.job_title ? ` (${c.job_title})` : ""}${c.is_primary ? " ★ Primary" : ""}`);
        });
      }
    }

    // Generate AI brief
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("No AI API key configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are NQI Hub's Discovery Prep Agent. Generate a concise meeting preparation brief in JSON format with:
- executive_summary: 2-3 sentences about the org and relationship
- talking_points: array of 4-6 suggested discussion topics
- questions_to_ask: array of 3-5 strategic questions
- risks_and_opportunities: array of strings
- recommended_services: array of service names that may fit based on context
Return ONLY valid JSON, no markdown.`,
          },
          {
            role: "user",
            content: `Prepare a discovery brief for this upcoming meeting:\n\nMeeting: ${meeting.title}\nType: ${meeting.meeting_type}\nNotes: ${meeting.notes || "None"}\n\nContext:\n${contextParts.join("\n")}`,
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

    let brief;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      brief = JSON.parse(jsonStr);
    } catch {
      brief = { executive_summary: content, talking_points: [], questions_to_ask: [], risks_and_opportunities: [], recommended_services: [] };
    }

    // Store as meeting analysis (discovery prep type)
    await supabase
      .from("meetings")
      .update({ analysis: { type: "discovery_prep", ...brief, context: contextParts } })
      .eq("id", meetingId);

    // Log activity
    await supabase.from("activity_log").insert({
      entity_type: "meetings",
      entity_id: meetingId,
      action: "discovery_prep_generated",
      metadata: { talking_points_count: brief.talking_points?.length || 0 },
    });

    return new Response(JSON.stringify({ success: true, brief }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
