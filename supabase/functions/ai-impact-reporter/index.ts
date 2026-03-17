import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert in analysing training and workshop feedback for Neurodiversity Global.

Analyse the provided feedback responses and produce a structured impact report including:
1. Overall satisfaction score (average of all numeric ratings)
2. Key themes from open-text responses (cluster similar feedback)
3. Sentiment analysis (positive, neutral, negative percentages)
4. Strengths identified
5. Areas for improvement
6. Actionable recommendations

Format as clear markdown with headers. Be neurodiversity-informed and strengths-based in your analysis.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { formTitle, responses, kirkpatrickLevel, deliveryTitle } = await req.json();

    const userPrompt = `Analyse these feedback responses for "${formTitle || "Workshop Feedback"}":
${deliveryTitle ? `Workshop: ${deliveryTitle}` : ""}
${kirkpatrickLevel ? `Kirkpatrick Level: ${kirkpatrickLevel}` : ""}

Responses (${responses?.length || 0} total):
${JSON.stringify(responses || [], null, 2)}`;

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
      content = data.content?.[0]?.text ?? "Unable to generate summary.";
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
      content = data.choices?.[0]?.message?.content ?? "Unable to generate summary.";
    } else {
      throw new Error("No AI API key configured");
    }

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
            agent: "impact-reporter",
            input: { formTitle, responseCount: responses?.length },
            output: content.substring(0, 1000),
            model: anthropicKey ? "claude-sonnet-4-5" : "gemini-2.5-flash",
          });
        }
      }
    } catch { /* non-critical */ }

    return new Response(JSON.stringify({ summary: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
