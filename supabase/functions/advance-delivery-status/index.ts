import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  planning: ["scheduled", "cancelled"],
  scheduled: ["in_progress", "cancelled"],
  in_progress: ["delivered", "cancelled"],
  delivered: ["follow_up", "complete", "cancelled"],
  follow_up: ["complete", "cancelled"],
  complete: [],
  cancelled: [],
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

    const { deliveryId, newStatus } = await req.json();

    if (!deliveryId || !newStatus) {
      return new Response(JSON.stringify({ error: "deliveryId and newStatus are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch current delivery
    const { data: delivery, error: fetchError } = await supabase
      .from("deliveries")
      .select("*, projects(name, owner_id)")
      .eq("id", deliveryId)
      .single();

    if (fetchError || !delivery) {
      return new Response(JSON.stringify({ error: "Delivery not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate transition
    const allowed = VALID_TRANSITIONS[delivery.status] || [];
    if (!allowed.includes(newStatus)) {
      return new Response(
        JSON.stringify({
          error: `Cannot transition from '${delivery.status}' to '${newStatus}'. Valid transitions: ${allowed.join(", ") || "none"}.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Pre-transition validation
    if (newStatus === "scheduled") {
      if (!delivery.delivery_date) {
        return new Response(
          JSON.stringify({ error: "Cannot schedule: delivery_date is required." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (!delivery.facilitator_id) {
        return new Response(
          JSON.stringify({ error: "Cannot schedule: facilitator is required." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Update delivery status
    const { data: updated, error: updateError } = await supabase
      .from("deliveries")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", deliveryId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Side-effects
    const projectOwner = (delivery as any).projects?.owner_id;

    if (newStatus === "delivered") {
      // Create follow-up task
      await supabase.from("tasks").insert({
        title: `Follow up: ${delivery.title}`,
        status: "todo",
        priority: "high",
        project_id: delivery.project_id,
        delivery_id: deliveryId,
        assignee: projectOwner || user.id,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        description: `Follow up on delivered workshop "${delivery.title}". Check feedback responses and client satisfaction.`,
      });

      // Create notification about feedback
      if (delivery.feedback_form_id) {
        await supabase.from("notifications").insert({
          user_id: projectOwner || user.id,
          type: "delivery_reminder",
          title: "Feedback form ready",
          body: `Workshop "${delivery.title}" delivered. Send feedback form to delegates.`,
          entity_type: "delivery",
          entity_id: deliveryId,
        });
      }
    }

    if (newStatus === "complete") {
      // Calculate satisfaction_score from form responses
      if (delivery.feedback_form_id) {
        const { data: responses } = await supabase
          .from("form_responses")
          .select("data")
          .eq("form_id", delivery.feedback_form_id);

        if (responses && responses.length > 0) {
          const scores: number[] = [];
          for (const resp of responses) {
            const data = typeof resp.data === "string" ? JSON.parse(resp.data) : resp.data;
            for (const [, value] of Object.entries(data)) {
              if (typeof value === "number" && value >= 1 && value <= 10) {
                scores.push(value);
              }
            }
          }
          if (scores.length > 0) {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            const rounded = Math.round(avg * 10) / 10;
            await supabase
              .from("deliveries")
              .update({ satisfaction_score: rounded })
              .eq("id", deliveryId);
          }
        }
      }
    }

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: user.id,
      entity_type: "delivery",
      entity_id: deliveryId,
      action: "status_changed",
      metadata: { from: delivery.status, to: newStatus },
    });

    // Notify project owner
    if (projectOwner) {
      await supabase.from("notifications").insert({
        user_id: projectOwner,
        type: "project_status",
        title: `Workshop status updated`,
        body: `"${delivery.title}" moved to ${newStatus.replace(/_/g, " ")}`,
        entity_type: "delivery",
        entity_id: deliveryId,
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
