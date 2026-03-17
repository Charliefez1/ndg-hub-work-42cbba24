import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeliveryInput {
  service_id: string;
  title: string;
  neuro_phase?: string;
  kirkpatrick_level?: number;
  delivery_date?: string;
  delegate_count?: number;
  duration_minutes?: number;
  location?: string;
}

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

    // Verify user
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

    const { organisationId, name, deliveries = [], intendedNeuroPhase, budget, startDate, endDate, notes } = await req.json();

    if (!organisationId || !name) {
      return new Response(JSON.stringify({ error: "organisationId and name are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        organisation_id: organisationId,
        name,
        status: "contracting",
        intended_neuro_phase: intendedNeuroPhase || null,
        budget: budget || null,
        start_date: startDate || null,
        end_date: endDate || null,
        notes: notes || null,
        owner_id: user.id,
      })
      .select()
      .single();

    if (projectError) throw projectError;

    const createdDeliveries = [];
    const createdSessions = [];
    const createdForms = [];

    for (let i = 0; i < (deliveries as DeliveryInput[]).length; i++) {
      const d = deliveries[i] as DeliveryInput;

      // Create delivery
      const { data: delivery, error: delError } = await supabase
        .from("deliveries")
        .insert({
          project_id: project.id,
          organisation_id: organisationId,
          title: d.title,
          service_id: d.service_id || null,
          status: "planning",
          neuro_phase: d.neuro_phase || null,
          kirkpatrick_level: d.kirkpatrick_level || null,
          delivery_date: d.delivery_date || null,
          delegate_count: d.delegate_count || null,
          duration_minutes: d.duration_minutes || null,
          location: d.location || null,
          sort_order: i,
        })
        .select()
        .single();

      if (delError) throw delError;
      createdDeliveries.push(delivery);

      // Create default session per delivery
      const { data: session, error: sessError } = await supabase
        .from("sessions")
        .insert({
          delivery_id: delivery.id,
          project_id: project.id,
          title: `${d.title} - Session 1`,
          session_type: "workshop",
          duration_minutes: d.duration_minutes || 90,
          neuro_phase: d.neuro_phase || null,
          content_status: "draft",
          sort_order: 0,
        })
        .select()
        .single();

      if (sessError) throw sessError;
      createdSessions.push(session);

      // Create default feedback form per delivery
      const { data: form, error: formError } = await supabase
        .from("forms")
        .insert({
          title: `${d.title} - Feedback`,
          type: "feedback",
          kirkpatrick_level: 1,
          delivery_id: delivery.id,
          project_id: project.id,
          fields: JSON.stringify([
            { type: "rating", label: "Overall Satisfaction", required: true },
            { type: "textarea", label: "What worked well?", required: false },
            { type: "textarea", label: "What could be improved?", required: false },
            { type: "nps", label: "How likely are you to recommend this workshop?", required: true },
          ]),
        })
        .select()
        .single();

      if (formError) throw formError;
      createdForms.push(form);

      // Link feedback form to delivery
      await supabase
        .from("deliveries")
        .update({ feedback_form_id: form.id })
        .eq("id", delivery.id);
    }

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: user.id,
      entity_type: "project",
      entity_id: project.id,
      action: "created",
      metadata: {
        name: project.name,
        deliveries_count: createdDeliveries.length,
        sessions_count: createdSessions.length,
        forms_count: createdForms.length,
      },
    });

    return new Response(
      JSON.stringify({
        data: {
          project,
          deliveries: createdDeliveries,
          sessions: createdSessions,
          forms: createdForms,
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
