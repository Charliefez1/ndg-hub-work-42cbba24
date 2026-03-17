import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STATUS_ORDER = [
  "contracting",
  "project_planning",
  "session_planning",
  "content_review",
  "delivery",
  "feedback_analytics",
  "closed",
] as const;

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

    const { projectId, newStatus } = await req.json();

    if (!projectId || !newStatus) {
      return new Response(JSON.stringify({ error: "projectId and newStatus are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch current project
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (fetchError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate transition: must follow sequence, no skipping
    const currentIdx = STATUS_ORDER.indexOf(project.status as any);
    const newIdx = STATUS_ORDER.indexOf(newStatus as any);

    if (newIdx === -1) {
      return new Response(JSON.stringify({ error: `Invalid status: ${newStatus}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (newIdx !== currentIdx + 1) {
      return new Response(
        JSON.stringify({
          error: `Cannot transition from '${project.status}' to '${newStatus}'. Next valid status is '${STATUS_ORDER[currentIdx + 1] || "none"}'.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Special validation for closing
    if (newStatus === "closed") {
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, status")
        .eq("project_id", projectId)
        .neq("status", "paid");

      if (invoices && invoices.length > 0) {
        return new Response(
          JSON.stringify({ error: "Cannot close project: there are unpaid invoices." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Special validation for feedback_analytics
    if (newStatus === "feedback_analytics") {
      const { data: deliveries } = await supabase
        .from("deliveries")
        .select("id, status")
        .eq("project_id", projectId)
        .not("status", "in", '("delivered","complete","cancelled")');

      if (deliveries && deliveries.length > 0) {
        return new Response(
          JSON.stringify({ error: "Cannot move to feedback_analytics: not all deliveries are delivered/complete." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Update project status
    const { data: updated, error: updateError } = await supabase
      .from("projects")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", projectId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: user.id,
      entity_type: "project",
      entity_id: projectId,
      action: "status_changed",
      metadata: { from: project.status, to: newStatus },
    });

    // Create notification for project owner
    if (project.owner_id) {
      await supabase.from("notifications").insert({
        user_id: project.owner_id,
        type: "project_status",
        title: `Project status updated`,
        body: `"${project.name}" moved to ${newStatus.replace(/_/g, " ")}`,
        entity_type: "project",
        entity_id: projectId,
      });
    }

    return new Response(JSON.stringify({ data: updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
