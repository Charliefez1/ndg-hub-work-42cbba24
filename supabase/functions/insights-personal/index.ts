import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Energy patterns (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const { data: energyData } = await supabase
      .from("daily_states")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", thirtyDaysAgo)
      .order("date");

    // Focus patterns by day of week
    const dayMap: Record<string, { energy: number[]; focus: number[] }> = {};
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (const d of energyData || []) {
      const dayName = days[new Date(d.date).getDay()];
      if (!dayMap[dayName]) dayMap[dayName] = { energy: [], focus: [] };
      if (d.energy_level) dayMap[dayName].energy.push(d.energy_level);
      if (d.focus_level) dayMap[dayName].focus.push(d.focus_level);
    }

    const focusByDay = days.map((day) => {
      const data = dayMap[day] || { energy: [], focus: [] };
      return {
        day,
        avgEnergy: data.energy.length
          ? Math.round((data.energy.reduce((a, b) => a + b, 0) / data.energy.length) * 10) / 10
          : null,
        avgFocus: data.focus.length
          ? Math.round((data.focus.reduce((a, b) => a + b, 0) / data.focus.length) * 10) / 10
          : null,
      };
    });

    // Recovery tracking: energy on delivery days vs non-delivery days
    const { data: deliveries } = await supabase
      .from("deliveries")
      .select("delivery_date")
      .eq("facilitator_id", user.id)
      .gte("delivery_date", thirtyDaysAgo)
      .not("delivery_date", "is", null);

    const deliveryDates = new Set((deliveries || []).map((d) => d.delivery_date));

    const deliveryDayEnergy: number[] = [];
    const nonDeliveryDayEnergy: number[] = [];
    for (const d of energyData || []) {
      if (d.energy_level) {
        if (deliveryDates.has(d.date)) {
          deliveryDayEnergy.push(d.energy_level);
        } else {
          nonDeliveryDayEnergy.push(d.energy_level);
        }
      }
    }

    const avgFn = (arr: number[]) =>
      arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;

    // Optimal work window suggestion
    const bestDay = focusByDay
      .filter((d) => d.avgFocus !== null)
      .sort((a, b) => (b.avgFocus || 0) - (a.avgFocus || 0))[0];

    return new Response(
      JSON.stringify({
        data: {
          energyOverTime: (energyData || []).map((d) => ({
            date: d.date,
            energy: d.energy_level,
            focus: d.focus_level,
          })),
          focusByDay,
          recovery: {
            avgEnergyDeliveryDays: avgFn(deliveryDayEnergy),
            avgEnergyNonDeliveryDays: avgFn(nonDeliveryDayEnergy),
            deliveryDaysCount: deliveryDayEnergy.length,
            nonDeliveryDaysCount: nonDeliveryDayEnergy.length,
          },
          optimalWindow: bestDay
            ? `You tend to focus best on ${bestDay.day}s (avg focus: ${bestDay.avgFocus}/10)`
            : "Not enough data yet. Log your energy daily for personalised insights.",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
