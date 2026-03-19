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

    // Find recurring tasks that are done and need to be recreated
    const { data: recurringTasks, error: fetchErr } = await supabase
      .from("tasks")
      .select("*")
      .not("recurrence", "is", null)
      .eq("status", "done")
      .eq("is_template", false);

    if (fetchErr) throw fetchErr;

    let created = 0;

    for (const task of recurringTasks || []) {
      if (!task.completed_at) continue;

      const completedDate = new Date(task.completed_at);
      let shouldCreate = false;
      let newDueDate: string | null = null;

      switch (task.recurrence) {
        case "daily": {
          // If completed today or earlier, create for tomorrow
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          shouldCreate = completedDate.toISOString().split("T")[0] <= todayStr;
          newDueDate = tomorrow.toISOString().split("T")[0];
          break;
        }
        case "weekly": {
          const daysSince = Math.floor((now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
          shouldCreate = daysSince >= 6; // Create new one near end of week
          const nextWeek = new Date(task.due_date ? new Date(task.due_date) : now);
          nextWeek.setDate(nextWeek.getDate() + 7);
          newDueDate = nextWeek.toISOString().split("T")[0];
          break;
        }
        case "monthly": {
          const monthsSince = (now.getFullYear() - completedDate.getFullYear()) * 12 + (now.getMonth() - completedDate.getMonth());
          shouldCreate = monthsSince >= 1 || (monthsSince === 0 && now.getDate() >= completedDate.getDate());
          const nextMonth = new Date(task.due_date ? new Date(task.due_date) : now);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          newDueDate = nextMonth.toISOString().split("T")[0];
          break;
        }
      }

      if (!shouldCreate) continue;

      // Check if we already created a follow-up
      const { data: existing } = await supabase
        .from("tasks")
        .select("id")
        .eq("template_id", task.id)
        .eq("status", "todo")
        .limit(1);

      if (existing && existing.length > 0) continue;

      const { error: insertErr } = await supabase.from("tasks").insert({
        title: task.title,
        description: task.description,
        project_id: task.project_id,
        delivery_id: task.delivery_id,
        assignee: task.assignee,
        priority: task.priority,
        due_date: newDueDate,
        recurrence: task.recurrence,
        recurrence_rule: task.recurrence_rule,
        template_id: task.id,
        parent_task_id: task.parent_task_id,
        status: "todo",
      });

      if (!insertErr) created++;
    }

    return new Response(
      JSON.stringify({ success: true, created, processed: recurringTasks?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
