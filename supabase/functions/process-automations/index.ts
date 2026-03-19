import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const results: string[] = [];

    // 1. Overdue task alerts
    const { data: overdueTasks } = await supabase
      .from("tasks")
      .select("id, title, assignee, due_date")
      .lt("due_date", todayStr)
      .in("status", ["todo", "in_progress", "review"])
      .eq("is_template", false);

    for (const task of overdueTasks || []) {
      if (!task.assignee) continue;
      // Check if notification already exists today
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("entity_id", task.id)
        .eq("type", "task_overdue")
        .gte("created_at", `${todayStr}T00:00:00`)
        .limit(1);
      if (existing && existing.length > 0) continue;

      await supabase.from("notifications").insert({
        user_id: task.assignee,
        type: "task_overdue",
        title: `Overdue: ${task.title}`,
        body: `This task was due on ${task.due_date} and is still not complete.`,
        entity_type: "task",
        entity_id: task.id,
      });
      results.push(`Overdue alert: ${task.title}`);
    }

    // 2. Stale task nudges (in_progress for >3 days without update)
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const { data: staleTasks } = await supabase
      .from("tasks")
      .select("id, title, assignee, updated_at")
      .eq("status", "in_progress")
      .lt("updated_at", threeDaysAgo.toISOString())
      .eq("is_template", false);

    for (const task of staleTasks || []) {
      if (!task.assignee) continue;
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("entity_id", task.id)
        .eq("type", "task_stale")
        .gte("created_at", `${todayStr}T00:00:00`)
        .limit(1);
      if (existing && existing.length > 0) continue;

      await supabase.from("notifications").insert({
        user_id: task.assignee,
        type: "task_stale",
        title: `Still working on "${task.title}"?`,
        body: `This task has been in progress for 3+ days without updates.`,
        entity_type: "task",
        entity_id: task.id,
      });
      results.push(`Stale nudge: ${task.title}`);
    }

    // 3. Workload balancer — notify admin if any user has >10 active tasks
    const { data: allActiveTasks } = await supabase
      .from("tasks")
      .select("assignee")
      .in("status", ["todo", "in_progress", "review"])
      .not("assignee", "is", null)
      .eq("is_template", false);

    const taskCounts: Record<string, number> = {};
    for (const t of allActiveTasks || []) {
      if (t.assignee) taskCounts[t.assignee] = (taskCounts[t.assignee] || 0) + 1;
    }

    // Find admins
    const { data: admins } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    for (const [userId, count] of Object.entries(taskCounts)) {
      if (count <= 10) continue;
      for (const admin of admins || []) {
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", admin.user_id)
          .eq("type", "workload_alert")
          .gte("created_at", `${todayStr}T00:00:00`)
          .limit(1);
        if (existing && existing.length > 0) continue;

        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", userId)
          .single();

        await supabase.from("notifications").insert({
          user_id: admin.user_id,
          type: "workload_alert",
          title: `Workload alert: ${profile?.display_name || "Team member"}`,
          body: `Has ${count} active tasks assigned. Consider redistributing.`,
          entity_type: "task",
          entity_id: userId,
        });
        results.push(`Workload alert for ${profile?.display_name}: ${count} tasks`);
      }
    }

    // 4. Invoice reminders — unpaid invoices past due
    const { data: overdueInvoices } = await supabase
      .from("invoices")
      .select("id, invoice_number, due_date, total")
      .lt("due_date", todayStr)
      .in("status", ["sent", "draft"]);

    for (const inv of overdueInvoices || []) {
      for (const admin of admins || []) {
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("entity_id", inv.id)
          .eq("type", "invoice_overdue")
          .gte("created_at", `${todayStr}T00:00:00`)
          .limit(1);
        if (existing && existing.length > 0) continue;

        await supabase.from("notifications").insert({
          user_id: admin.user_id,
          type: "invoice_overdue",
          title: `Overdue invoice: ${inv.invoice_number}`,
          body: `£${inv.total} was due on ${inv.due_date}. Follow up with the client.`,
          entity_type: "invoice",
          entity_id: inv.id,
        });
        results.push(`Invoice reminder: ${inv.invoice_number}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, actions: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
