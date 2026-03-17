import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EXTRACTION_PROMPT = `You are an AI that extracts structured project data from unstructured text (proposals, emails, plans).

Return ONLY valid JSON with this exact structure:
{
  "projectName": "string",
  "organisationName": "string (if mentioned)",
  "intendedNeuroPhase": "needs|engage|understand|realise|ongoing (best guess)",
  "budget": number or null,
  "startDate": "YYYY-MM-DD or null",
  "endDate": "YYYY-MM-DD or null",
  "notes": "any additional context",
  "deliveries": [
    {
      "title": "string",
      "serviceType": "awareness_workshop|champions_workshop|managers_workshop|leaders_workshop|content_design|consultancy|policy_design",
      "neuroPhase": "needs|engage|understand|realise|ongoing",
      "kirkpatrickLevel": 1-4,
      "delegateCount": number or null,
      "durationMinutes": number or null,
      "deliveryDate": "YYYY-MM-DD or null"
    }
  ]
}

Map service types based on context:
- Awareness/introductory workshops → awareness_workshop
- Champions/advocates/ally training → champions_workshop
- Manager/leader training → managers_workshop or leaders_workshop
- Content creation/design → content_design
- Advisory/consulting → consultancy
- Policy review/creation → policy_design

Kirkpatrick levels:
1 = Reaction (satisfaction), 2 = Learning (knowledge gain), 3 = Behaviour (applied at work), 4 = Results (business impact)

Extract as much structured data as possible. If uncertain, make reasonable assumptions and note them in the notes field.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Claude Haiku for fast extraction
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      // Fallback to Lovable gateway if no Anthropic key
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
            { role: "system", content: EXTRACTION_PROMPT },
            { role: "user", content: text },
          ],
          max_tokens: 2048,
        }),
      });

      if (!response.ok) throw new Error(`AI API error: ${response.status}`);
      const aiData = await response.json();
      const content = aiData.choices?.[0]?.message?.content ?? "";

      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("AI did not return valid JSON");

      const extracted = JSON.parse(jsonMatch[0]);

      // Save to ai_generations
      await supabase.from("ai_generations").insert({
        user_id: user.id,
        agent: "extract",
        input: { text: text.substring(0, 500) },
        output: JSON.stringify(extracted),
        model: "gemini-2.5-flash",
      });

      return new Response(JSON.stringify({ data: extracted }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Claude API path
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        system: EXTRACTION_PROMPT,
        messages: [{ role: "user", content: text }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude API error: ${response.status} ${errText}`);
    }

    const aiData = await response.json();
    const content = aiData.content?.[0]?.text ?? "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return valid JSON");

    const extracted = JSON.parse(jsonMatch[0]);

    // Save to ai_generations
    await supabase.from("ai_generations").insert({
      user_id: user.id,
      agent: "extract",
      input: { text: text.substring(0, 500) },
      output: JSON.stringify(extracted),
      model: "claude-haiku-4-5",
      tokens_used: aiData.usage?.output_tokens,
    });

    return new Response(JSON.stringify({ data: extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
