import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // Get authenticated user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, serviceKey);
    const today = new Date().toISOString().split("T")[0];

    // Gather data for coaching
    const [tasksRes, overdueRes, energyRes, deliveriesRes] = await Promise.all([
      serviceClient.from("tasks").select("title, status, priority, due_date, assignee, recurrence").eq("is_template", false).in("status", ["todo", "in_progress", "review", "blocked"]).order("due_date", { ascending: true }).limit(50),
      serviceClient.from("tasks").select("title, due_date, priority, status").lt("due_date", today).in("status", ["todo", "in_progress", "review"]).limit(20),
      serviceClient.from("daily_states").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(7),
      serviceClient.from("deliveries").select("title, delivery_date, status").gte("delivery_date", today).order("delivery_date", { ascending: true }).limit(10),
    ]);

    const activeTasks = tasksRes.data || [];
    const overdueTasks = overdueRes.data || [];
    const recentEnergy = energyRes.data || [];
    const upcomingDeliveries = deliveriesRes.data || [];

    // Focus sessions today
    const { data: focusSessions } = await serviceClient
      .from("focus_sessions")
      .select("duration_minutes, completed")
      .eq("user_id", user.id)
      .gte("created_at", `${today}T00:00:00`)
      .eq("completed", true);

    const totalFocusMinutes = (focusSessions || []).reduce((sum, s) => sum + s.duration_minutes, 0);

    const systemPrompt = `You are an ADHD-friendly productivity coach integrated into a work management system. 
You are warm, direct, and practical. You understand neurodivergent working patterns.
Keep your response under 300 words. Use emoji sparingly but effectively.
Structure your response with:
1. A brief greeting with energy acknowledgment
2. Top 3 priorities for today (be specific)
3. Any warnings (overdue tasks, upcoming deadlines)
4. One actionable suggestion based on patterns you notice
5. An encouraging sign-off

Be honest about workload — if it's heavy, acknowledge it. If energy is low, suggest lighter tasks first.`;

    const userPrompt = `Here's my current work state:

**Active Tasks (${activeTasks.length}):**
${activeTasks.slice(0, 15).map(t => `- [${t.priority}] ${t.title} (${t.status}${t.due_date ? `, due ${t.due_date}` : ''})`).join("\n")}

**Overdue Tasks (${overdueTasks.length}):**
${overdueTasks.map(t => `- [${t.priority}] ${t.title} (due ${t.due_date})`).join("\n") || "None! 🎉"}

**Recent Energy Levels (last 7 days):**
${recentEnergy.map(e => `${e.date}: energy=${e.energy_level}/5, focus=${e.focus_level}/5, mood=${e.mood || "not set"}`).join("\n") || "No check-ins yet"}

**Focus Sessions Today:** ${totalFocusMinutes} minutes completed

**Upcoming Deliveries:**
${upcomingDeliveries.map(d => `- ${d.title} on ${d.delivery_date} (${d.status})`).join("\n") || "None this week"}

Today is ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}.
Please give me my daily coaching brief.`;

    const aiResponse = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 800,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI Gateway error: ${aiResponse.status} ${errText}`);
    }

    const aiData = await aiResponse.json();
    const coachMessage = aiData.choices?.[0]?.message?.content || "Unable to generate coaching brief right now.";

    return new Response(
      JSON.stringify({
        message: coachMessage,
        stats: {
          active_tasks: activeTasks.length,
          overdue_tasks: overdueTasks.length,
          focus_minutes_today: totalFocusMinutes,
          upcoming_deliveries: upcomingDeliveries.length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
