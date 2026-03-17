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

    const { projectId, deliveryIds } = await req.json();

    if (!projectId || !deliveryIds?.length) {
      return new Response(JSON.stringify({ error: "projectId and deliveryIds are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch project
    const { data: project, error: projError } = await supabase
      .from("projects")
      .select("*, organisations(name)")
      .eq("id", projectId)
      .single();

    if (projError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch deliveries with their services
    const { data: deliveries, error: delError } = await supabase
      .from("deliveries")
      .select("*, services(name, price)")
      .in("id", deliveryIds)
      .eq("project_id", projectId);

    if (delError) throw delError;
    if (!deliveries?.length) {
      return new Response(JSON.stringify({ error: "No valid deliveries found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check all deliveries have services with prices
    for (const d of deliveries) {
      if (!(d as any).services?.price) {
        return new Response(
          JSON.stringify({ error: `Delivery "${d.title}" has no linked service with a price.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Generate invoice number: NDG-YYYYMM-NNN
    const now = new Date();
    const prefix = `NDG-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const { count } = await supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .like("invoice_number", `${prefix}%`);
    const seq = String((count || 0) + 1).padStart(3, "0");
    const invoiceNumber = `${prefix}-${seq}`;

    // Calculate totals
    let subtotal = 0;
    const items: Array<{
      delivery_id: string;
      service_id: string;
      description: string;
      quantity: number;
      unit_price: number;
      total: number;
    }> = [];

    for (const d of deliveries) {
      const service = (d as any).services;
      const unitPrice = Number(service.price);
      const orgName = (project as any).organisations?.name || "";
      const dateStr = d.delivery_date || "TBC";
      const description = `${service.name} - ${orgName} - ${dateStr}`;

      items.push({
        delivery_id: d.id,
        service_id: d.service_id!,
        description,
        quantity: 1,
        unit_price: unitPrice,
        total: unitPrice,
      });
      subtotal += unitPrice;
    }

    const vatRate = 20.0;
    const vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
    const total = Math.round((subtotal + vatAmount) * 100) / 100;

    // Create invoice
    const { data: invoice, error: invError } = await supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        organisation_id: project.organisation_id,
        project_id: projectId,
        status: "draft",
        subtotal,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        total,
      })
      .select()
      .single();

    if (invError) throw invError;

    // Create invoice items
    const itemInserts = items.map((item) => ({
      invoice_id: invoice.id,
      ...item,
    }));

    const { data: invoiceItems, error: itemsError } = await supabase
      .from("invoice_items")
      .insert(itemInserts)
      .select();

    if (itemsError) throw itemsError;

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: user.id,
      entity_type: "invoice",
      entity_id: invoice.id,
      action: "created",
      metadata: {
        invoice_number: invoiceNumber,
        subtotal,
        vat_amount: vatAmount,
        total,
        items_count: items.length,
      },
    });

    return new Response(
      JSON.stringify({ data: { invoice, items: invoiceItems } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
