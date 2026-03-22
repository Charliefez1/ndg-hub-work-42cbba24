import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Deal Won Handoff Superagent
 * Triggered when a project status changes to "delivering".
 * Auto-scaffolds: tasks, delivery records, feedback forms, and notifications.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { projectId } = await req.json();
    if (!projectId) throw new Error("projectId is required");

    // Fetch project with organisation
    const { data: project, error: pErr } = await supabase
      .from("projects")
      .select("*, organisations(name)")
      .eq("id", projectId)
      .single();
    if (pErr) throw pErr;

    const results: string[] = [];

    // 1. Create default onboarding tasks
    const defaultTasks = [
      { title: `Kick-off call with ${(project as any).organisations?.name || 'client'}`, priority: "high", status: "todo" },
      { title: "Confirm delivery dates and logistics", priority: "high", status: "todo" },
      { title: "Prepare participant communications", priority: "medium", status: "todo" },
      { title: "Set up feedback forms", priority: "medium", status: "todo" },
      { title: "Final content review and sign-off", priority: "medium", status: "todo" },
    ];

    const { data: tasks, error: tErr } = await supabase
      .from("tasks")
      .insert(defaultTasks.map((t) => ({
        ...t,
        project_id: projectId,
        organisation_id: project.organisation_id,
      })))
      .select("id");
    if (tErr) throw tErr;
    results.push(`Created ${tasks.length} onboarding tasks`);

    // 2. Create a default feedback form for the project
    const { error: fErr } = await supabase
      .from("forms")
      .insert({
        title: `${project.name} — Post-Workshop Feedback`,
        type: "feedback",
        project_id: projectId,
        organisation_id: project.organisation_id,
        fields: [
          { name: "overall_rating", label: "Overall satisfaction (1-10)", type: "number", required: true },
          { name: "facilitator_rating", label: "Facilitator rating (1-10)", type: "number", required: true },
          { name: "most_useful", label: "What was most useful?", type: "textarea", required: false },
          { name: "improvement", label: "What could be improved?", type: "textarea", required: false },
          { name: "would_recommend", label: "Would you recommend this to a colleague?", type: "select", options: ["Yes", "No", "Maybe"], required: true },
        ],
        active: true,
      });
    if (!fErr) results.push("Created feedback form template");

    // 3. Create notification for team
    const { data: teamMembers } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "team"]);

    if (teamMembers?.length) {
      await supabase.from("notifications").insert(
        teamMembers.map((m) => ({
          user_id: m.user_id,
          title: `🎉 Deal Won: ${project.name}`,
          body: `${(project as any).organisations?.name || 'Client'} project "${project.name}" is now in delivery. Onboarding tasks have been created.`,
          type: "project",
          entity_type: "project",
          entity_id: projectId,
        })),
      );
      results.push(`Notified ${teamMembers.length} team members`);
    }

    // 4. Log activity
    await supabase.from("activity_log").insert({
      entity_type: "projects",
      entity_id: projectId,
      action: "deal_won_handoff",
      metadata: { results },
    });

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
