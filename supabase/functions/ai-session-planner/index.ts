import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert workshop session planner for Neurodiversity Global, a UK neurodiversity consulting firm.

Given a workshop context, generate a structured agenda as a JSON array. Each item must have:
- title: descriptive name for this block
- type: one of "intro", "activity", "break", "debrief", "energiser"
- duration_minutes: integer
- description: brief description
- method: delivery method (e.g., "Presentation", "Group discussion", "Paired exercise")

Rules:
- Total duration must match requested duration
- Include breaks for sessions over 60 minutes
- Start with intro, end with debrief
- Include energiser for sessions over 90 minutes
- Content must be neurodiversity-informed and strengths-based
- Return ONLY a valid JSON array, no markdown or explanation.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { sessionTitle, deliveryTitle, serviceName, neuroPhase, durationMinutes = 90, delegateCount } = await req.json();

    const userPrompt = `Plan an agenda for:
- Session: ${sessionTitle || "Workshop Session"}
- Workshop: ${deliveryTitle || "Workshop"}
- Service: ${serviceName || "General Workshop"}
- NEURO phase: ${neuroPhase || "engage"}
- Duration: ${durationMinutes} minutes
- Delegates: ${delegateCount || 20} people`;

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    let content: string;

    if (anthropicKey) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250514",
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      if (!response.ok) throw new Error(`Claude API error: ${response.status}`);
      const data = await response.json();
      content = data.content?.[0]?.text ?? "[]";
    } else if (lovableKey) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 2048,
        }),
      });
      if (!response.ok) throw new Error(`AI API error: ${response.status}`);
      const data = await response.json();
      content = data.choices?.[0]?.message?.content ?? "[]";
    } else {
      throw new Error("No AI API key configured");
    }

    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    const rawJson = codeBlockMatch ? codeBlockMatch[1].trim() : (jsonMatch ? jsonMatch[0] : "[]");
    const agenda = JSON.parse(rawJson);

    // Save to ai_generations if auth present
    try {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
        const { data: { user } } = await anonClient.auth.getUser();
        if (user) {
          await supabase.from("ai_generations").insert({
            user_id: user.id,
            agent: "session-planner",
            input: { sessionTitle, deliveryTitle, serviceName, neuroPhase, durationMinutes },
            output: JSON.stringify(agenda),
            model: anthropicKey ? "claude-sonnet-4-5" : "gemini-2.5-flash",
          });
        }
      }
    } catch { /* non-critical */ }

    return new Response(JSON.stringify({ data: agenda }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
