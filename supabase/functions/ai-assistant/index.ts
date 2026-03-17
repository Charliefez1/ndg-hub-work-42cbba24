import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AGENT_PROMPTS: Record<string, string> = {
  general: `You are NDG Hub AI, the intelligent assistant for Neurodiversity Global's internal work management platform. You help with project management, workshop planning, client relations, and data analysis. Be concise, practical, and neurodiversity-informed in your responses.`,
  "project-planner": `You are NDG Hub's Project Planner AI. You help scope, plan, and structure neurodiversity projects. You understand the NDG delivery model: projects contain deliveries (workshops), which contain sessions with agenda items. Help create project plans, estimate timelines, and suggest workshop structures. NDG serves 750+ organisations including NHS trusts, universities, and corporates.`,
  "content-writer": `You are NDG Hub's Content Writer AI. You help draft workshop content, session agendas, training materials, and client communications. Your writing should be inclusive, neurodiversity-affirming, and strengths-based. Use person-first or identity-first language as appropriate.`,
  "data-analyst": `You are NDG Hub's Data Analyst AI. You help analyse feedback scores, project metrics, revenue data, and business KPIs. Provide clear insights with actionable recommendations. Focus on CSAT trends, Kirkpatrick levels, and delivery satisfaction.`,
};

async function callClaude(apiKey: string, systemPrompt: string, messages: Array<{role: string; content: string}>) {
  const claudeMessages = messages.map((m) => ({
    role: m.role === "system" ? "user" : m.role,
    content: m.content,
  }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: claudeMessages,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  return {
    content: data.content?.[0]?.text ?? "I couldn't generate a response.",
    tokensUsed: data.usage?.output_tokens,
  };
}

async function callLovableGateway(apiKey: string, systemPrompt: string, messages: Array<{role: string; content: string}>) {
  const aiMessages = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: aiMessages,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content ?? "I couldn't generate a response.",
    tokensUsed: null,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const { messages, agent = "general" } = await req.json();
    const systemPrompt = AGENT_PROMPTS[agent] || AGENT_PROMPTS.general;

    // Try Claude first, fall back to Lovable gateway
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    let result: { content: string; tokensUsed: number | null };
    let model: string;

    if (anthropicKey) {
      result = await callClaude(anthropicKey, systemPrompt, messages);
      model = "claude-sonnet-4-5";
    } else if (lovableKey) {
      result = await callLovableGateway(lovableKey, systemPrompt, messages);
      model = "gemini-2.5-flash";
    } else {
      throw new Error("No AI API key configured");
    }

    // Save to ai_generations if we have auth
    if (authHeader) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        const anonClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } },
        );
        const { data: { user } } = await anonClient.auth.getUser();
        if (user) {
          await supabase.from("ai_generations").insert({
            user_id: user.id,
            agent,
            input: { prompt: messages[messages.length - 1]?.content?.substring(0, 200) },
            output: result.content.substring(0, 500),
            model,
            tokens_used: result.tokensUsed,
          });
        }
      } catch { /* non-critical */ }
    }

    return new Response(JSON.stringify({ content: result.content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
