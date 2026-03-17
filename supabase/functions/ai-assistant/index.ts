import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const LOVABLE_API_URL = "https://ai-gateway.lovable.dev/api/v1/chat/completions";

const AGENT_PROMPTS: Record<string, string> = {
  general: `You are NDG Hub AI, the intelligent assistant for Neurodiversity Global's internal work management platform. You help with project management, workshop planning, client relations, and data analysis. Be concise, practical, and neurodiversity-informed in your responses.`,
  "project-planner": `You are NDG Hub's Project Planner AI. You help scope, plan, and structure neurodiversity projects. You understand the NDG delivery model: projects contain deliveries (workshops), which contain sessions with agenda items. Help create project plans, estimate timelines, and suggest workshop structures.`,
  "content-writer": `You are NDG Hub's Content Writer AI. You help draft workshop content, session agendas, training materials, and client communications. Your writing should be inclusive, neurodiversity-affirming, and strengths-based.`,
  "data-analyst": `You are NDG Hub's Data Analyst AI. You help analyse feedback scores, project metrics, revenue data, and business KPIs. Provide clear insights with actionable recommendations.`,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { messages, agent = "general" } = await req.json();
    const systemPrompt = AGENT_PROMPTS[agent] || AGENT_PROMPTS.general;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const response = await fetch(LOVABLE_API_URL, {
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
    const content = data.choices?.[0]?.message?.content ?? "I couldn't generate a response.";

    return new Response(JSON.stringify({ content }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
