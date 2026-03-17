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

    // CSAT trend — deliveries with satisfaction_score over time
    const { data: csatData } = await supabase
      .from("deliveries")
      .select("delivery_date, satisfaction_score, title, organisations(name)")
      .not("satisfaction_score", "is", null)
      .order("delivery_date");

    // Satisfaction by client
    const { data: byClient } = await supabase
      .from("deliveries")
      .select("organisation_id, satisfaction_score, organisations(name)")
      .not("satisfaction_score", "is", null);

    const clientMap: Record<string, { name: string; scores: number[] }> = {};
    for (const d of byClient || []) {
      const orgId = d.organisation_id;
      const orgName = (d as any).organisations?.name || "Unknown";
      if (!clientMap[orgId]) clientMap[orgId] = { name: orgName, scores: [] };
      clientMap[orgId].scores.push(Number(d.satisfaction_score));
    }
    const satisfactionByClient = Object.entries(clientMap).map(([id, { name, scores }]) => ({
      organisationId: id,
      name,
      avgScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
      count: scores.length,
    }));

    // Satisfaction by service type
    const { data: byService } = await supabase
      .from("deliveries")
      .select("service_id, satisfaction_score, services(name)")
      .not("satisfaction_score", "is", null)
      .not("service_id", "is", null);

    const serviceMap: Record<string, { name: string; scores: number[] }> = {};
    for (const d of byService || []) {
      const sId = d.service_id!;
      const sName = (d as any).services?.name || "Unknown";
      if (!serviceMap[sId]) serviceMap[sId] = { name: sName, scores: [] };
      serviceMap[sId].scores.push(Number(d.satisfaction_score));
    }
    const satisfactionByService = Object.entries(serviceMap).map(([id, { name, scores }]) => ({
      serviceId: id,
      name,
      avgScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
      count: scores.length,
    }));

    // Kirkpatrick distribution
    const { data: kirkData } = await supabase
      .from("deliveries")
      .select("kirkpatrick_level")
      .not("kirkpatrick_level", "is", null);

    const kirkDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const d of kirkData || []) {
      if (d.kirkpatrick_level) kirkDist[d.kirkpatrick_level]++;
    }

    // Revenue data (paid invoices by month)
    const { data: invoices } = await supabase
      .from("invoices")
      .select("total, paid_date")
      .eq("status", "paid")
      .not("paid_date", "is", null)
      .order("paid_date");

    const revenueByMonth: Record<string, number> = {};
    for (const inv of invoices || []) {
      const month = inv.paid_date!.substring(0, 7); // YYYY-MM
      revenueByMonth[month] = (revenueByMonth[month] || 0) + Number(inv.total);
    }

    return new Response(
      JSON.stringify({
        data: {
          csatTrend: (csatData || []).map((d) => ({
            date: d.delivery_date,
            score: Number(d.satisfaction_score),
            title: d.title,
            client: (d as any).organisations?.name,
          })),
          satisfactionByClient,
          satisfactionByService,
          kirkpatrickDistribution: Object.entries(kirkDist).map(([level, count]) => ({
            level: Number(level),
            count,
          })),
          revenueByMonth: Object.entries(revenueByMonth).map(([month, total]) => ({
            month,
            total,
          })),
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
