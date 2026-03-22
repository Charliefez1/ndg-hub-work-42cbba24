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

    // ─── QUEUE PROCESSING ───
    const { data: queueItems } = await supabase
      .from("automation_queue")
      .select("*")
      .eq("processed", false)
      .order("created_at", { ascending: true })
      .limit(50);

    for (const item of queueItems || []) {
      try {
        if (item.entity_type === "projects") {
          // When project moves to delivery → trigger deal-won superagent
          if (item.new_status === "delivery") {
            try {
              await supabase.functions.invoke("superagent-deal-won", {
                body: { projectId: item.entity_id },
              });
              results.push(`Triggered deal-won for project ${item.entity_id}`);
            } catch (e) {
              results.push(`Deal-won trigger failed: ${e.message}`);
            }
          }
        }

        if (item.entity_type === "deliveries") {
          // When delivery moves to delivered → auto-create feedback form if none exists
          if (item.new_status === "delivered") {
            const { data: delivery } = await supabase
              .from("deliveries")
              .select("id, title, project_id, organisation_id, feedback_form_id")
              .eq("id", item.entity_id)
              .single();

            if (delivery && !delivery.feedback_form_id) {
              const { data: form } = await supabase.from("forms").insert({
                title: `Feedback: ${delivery.title}`,
                type: "feedback",
                delivery_id: delivery.id,
                project_id: delivery.project_id,
                organisation_id: delivery.organisation_id,
                active: true,
                fields: [
                  { name: "rating", type: "rating", label: "Overall satisfaction (1-5)", required: true },
                  { name: "comments", type: "textarea", label: "Any comments or suggestions?", required: false },
                ],
              }).select().single();

              if (form) {
                await supabase.from("deliveries").update({ feedback_form_id: form.id }).eq("id", delivery.id);
                results.push(`Auto-created feedback form for: ${delivery.title}`);
              }
            }
          }

          // Check if ALL deliveries in a project are complete → advance project
          if (item.new_status === "complete") {
            const { data: delivery } = await supabase
              .from("deliveries")
              .select("project_id")
              .eq("id", item.entity_id)
              .single();

            if (delivery?.project_id) {
              const { data: allDeliveries } = await supabase
                .from("deliveries")
                .select("status")
                .eq("project_id", delivery.project_id);

              const allComplete = allDeliveries?.every(d => d.status === "complete" || d.status === "cancelled");
              if (allComplete && allDeliveries && allDeliveries.length > 0) {
                await supabase
                  .from("projects")
                  .update({ status: "feedback_analytics" })
                  .eq("id", delivery.project_id)
                  .in("status", ["delivery"]);
                results.push(`Auto-advanced project ${delivery.project_id} to feedback_analytics`);
              }
            }
          }
        }

        if (item.entity_type === "invoices") {
          // When invoice sent → schedule reminder if due_date exists
          if (item.new_status === "sent") {
            const { data: invoice } = await supabase
              .from("invoices")
              .select("id, invoice_number, due_date, organisation_id")
              .eq("id", item.entity_id)
              .single();

            if (invoice?.due_date) {
              const dueDate = new Date(invoice.due_date);
              const reminderDate = new Date(dueDate);
              reminderDate.setDate(reminderDate.getDate() - 3);

              if (reminderDate > now) {
                results.push(`Invoice ${invoice.invoice_number} reminder scheduled for ${reminderDate.toISOString().split("T")[0]}`);
              }
            }
          }
        }

        // Mark as processed
        await supabase
          .from("automation_queue")
          .update({ processed: true })
          .eq("id", item.id);
      } catch (e) {
        results.push(`Queue item ${item.id} error: ${e.message}`);
      }
    }

    // ─── EXISTING TIME-BASED CHECKS ───

    // 1. Overdue task alerts
    const { data: overdueTasks } = await supabase
      .from("tasks")
      .select("id, title, assignee, due_date")
      .lt("due_date", todayStr)
      .in("status", ["todo", "in_progress", "review"])
      .eq("is_template", false);

    for (const task of overdueTasks || []) {
      if (!task.assignee) continue;
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

    // 2. Stale task nudges
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

    // 3. Workload balancer
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

    // 4. Invoice reminders
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
