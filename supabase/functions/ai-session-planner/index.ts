import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const LOVABLE_API_URL = "https://ai-gateway.lovable.dev/api/v1/chat/completions";

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
    const { sessionTitle, deliveryTitle, serviceName, neuroPhase, durationMinutes = 90 } = await req.json();

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Create a detailed workshop session agenda for the following:
- Session: ${sessionTitle}
- Workshop: ${deliveryTitle}
- Service: ${serviceName || "General workshop"}
- Neuro Phase: ${neuroPhase || "Not specified"}
- Total Duration: ${durationMinutes} minutes

Return a JSON array of agenda items with this structure:
[{ "title": "...", "type": "activity|discussion|break|introduction|reflection|assessment", "duration_minutes": N, "description": "...", "method": "..." }]

The agenda should:
- Be neurodiversity-informed and inclusive
- Include varied activity types for different learning styles
- Include appropriate breaks
- Total duration should equal ${durationMinutes} minutes
- Use evidence-based facilitation methods`;

    const response = await fetch(LOVABLE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert workshop designer specialising in neurodiversity training. Return valid JSON only." },
          { role: "user", content: prompt },
        ],
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI API error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content ?? "[]";
    
    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) content = jsonMatch[1].trim();
    
    const agenda = JSON.parse(content);

    return new Response(JSON.stringify({ agenda }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
