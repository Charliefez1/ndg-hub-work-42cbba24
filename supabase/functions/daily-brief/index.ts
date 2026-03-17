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

    const today = new Date().toISOString().split("T")[0];
    const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Tasks due today + overdue
    const { data: tasksDueToday } = await supabase
      .from("tasks")
      .select("*")
      .eq("due_date", today)
      .neq("status", "done")
      .order("priority");

    const { data: tasksOverdue } = await supabase
      .from("tasks")
      .select("*")
      .lt("due_date", today)
      .neq("status", "done")
      .order("due_date");

    // Deliveries today
    const { data: deliveriesToday } = await supabase
      .from("deliveries")
      .select("*, organisations(name), services(name), projects(name)")
      .eq("delivery_date", today)
      .not("status", "in", '("complete","cancelled")');

    // Deliveries this week
    const { data: deliveriesThisWeek } = await supabase
      .from("deliveries")
      .select("*, organisations(name), services(name), projects(name)")
      .gte("delivery_date", today)
      .lte("delivery_date", weekEnd)
      .not("status", "in", '("complete","cancelled")')
      .order("delivery_date");

    // Energy level today
    const { data: energyToday } = await supabase
      .from("daily_states")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    // Recent energy history (last 7 days) for patterns
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const { data: energyHistory } = await supabase
      .from("daily_states")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", weekAgo)
      .order("date");

    // Red flags
    const { data: unpaidInvoices } = await supabase
      .from("invoices")
      .select("id, invoice_number, total, due_date, organisations(name)")
      .in("status", ["sent", "overdue"])
      .order("due_date");

    const { data: unconfirmedDeliveries } = await supabase
      .from("deliveries")
      .select("id, title, delivery_date, organisations(name)")
      .eq("status", "planning")
      .not("delivery_date", "is", null)
      .lt("delivery_date", weekEnd);

    const redFlags = [];
    if (tasksOverdue?.length) {
      redFlags.push({ type: "overdue_tasks", count: tasksOverdue.length, label: `${tasksOverdue.length} overdue task(s)` });
    }
    if (unconfirmedDeliveries?.length) {
      redFlags.push({ type: "unconfirmed_deliveries", count: unconfirmedDeliveries.length, label: `${unconfirmedDeliveries.length} unconfirmed delivery(ies) this week` });
    }
    if (unpaidInvoices?.length) {
      redFlags.push({ type: "unpaid_invoices", count: unpaidInvoices.length, label: `${unpaidInvoices.length} unpaid invoice(s)` });
    }

    return new Response(
      JSON.stringify({
        data: {
          tasksDueToday: tasksDueToday || [],
          tasksOverdue: tasksOverdue || [],
          deliveriesToday: deliveriesToday || [],
          deliveriesThisWeek: deliveriesThisWeek || [],
          energyToday,
          energyHistory: energyHistory || [],
          redFlags,
          unpaidInvoices: unpaidInvoices || [],
          unconfirmedDeliveries: unconfirmedDeliveries || [],
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
