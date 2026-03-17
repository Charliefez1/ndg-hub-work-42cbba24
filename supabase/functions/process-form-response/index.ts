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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { formId, data } = await req.json();

    if (!formId || !data) {
      return new Response(JSON.stringify({ error: "formId and data are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch form
    const { data: form, error: formError } = await supabase
      .from("forms")
      .select("*")
      .eq("id", formId)
      .single();

    if (formError || !form) {
      return new Response(JSON.stringify({ error: "Form not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save response
    const { data: response, error: respError } = await supabase
      .from("form_responses")
      .insert({
        form_id: formId,
        data,
        kirkpatrick_level: form.kirkpatrick_level,
      })
      .select()
      .single();

    if (respError) throw respError;

    // If feedback form linked to a delivery, calculate satisfaction_score
    if (form.type === "feedback" && form.delivery_id) {
      const { data: allResponses } = await supabase
        .from("form_responses")
        .select("data")
        .eq("form_id", formId);

      if (allResponses && allResponses.length > 0) {
        const scores: number[] = [];
        for (const resp of allResponses) {
          const respData = typeof resp.data === "string" ? JSON.parse(resp.data) : resp.data;
          for (const [, value] of Object.entries(respData)) {
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
            .eq("id", form.delivery_id);
        }
      }

      // Notify project owner
      if (form.project_id) {
        const { data: project } = await supabase
          .from("projects")
          .select("owner_id, name")
          .eq("id", form.project_id)
          .single();

        if (project?.owner_id) {
          await supabase.from("notifications").insert({
            user_id: project.owner_id,
            type: "form_response",
            title: "New feedback response",
            body: `New response submitted for "${form.title}" (${project.name})`,
            entity_type: "form",
            entity_id: formId,
          });
        }
      }
    }

    // Log activity
    await supabase.from("activity_log").insert({
      entity_type: "form_response",
      entity_id: response.id,
      action: "created",
      metadata: { form_id: formId, form_title: form.title },
    });

    return new Response(JSON.stringify({ data: response }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
