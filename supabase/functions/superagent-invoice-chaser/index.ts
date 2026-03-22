import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Invoice Chaser Superagent
 * Scans for overdue invoices, generates reminder notifications,
 * and optionally drafts follow-up emails.
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

    const today = new Date().toISOString().split("T")[0];

    // Find overdue invoices (sent but not paid, past due date)
    const { data: overdueInvoices, error } = await supabase
      .from("invoices")
      .select("*, organisations(name, email), projects(name)")
      .in("status", ["sent", "overdue"])
      .lt("due_date", today)
      .is("paid_date", null);
    if (error) throw error;

    if (!overdueInvoices?.length) {
      return new Response(JSON.stringify({ success: true, message: "No overdue invoices", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as overdue if still "sent"
    const toMarkOverdue = overdueInvoices.filter((inv) => inv.status === "sent").map((inv) => inv.id);
    if (toMarkOverdue.length) {
      await supabase.from("invoices").update({ status: "overdue" }).in("id", toMarkOverdue);
    }

    // Generate notifications for admin/team
    const { data: teamMembers } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "team"]);

    const adminUsers = teamMembers?.map((m) => m.user_id) || [];
    const notifications = [];

    for (const inv of overdueInvoices) {
      const orgName = (inv as any).organisations?.name || "Unknown client";
      const daysOverdue = Math.floor(
        (new Date().getTime() - new Date(inv.due_date!).getTime()) / (1000 * 60 * 60 * 24),
      );

      for (const userId of adminUsers) {
        notifications.push({
          user_id: userId,
          title: `⚠️ Invoice ${inv.invoice_number} overdue`,
          body: `${orgName} — £${Number(inv.total).toLocaleString()} is ${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue.`,
          type: "invoice",
          entity_type: "invoice",
          entity_id: inv.id,
        });
      }
    }

    if (notifications.length) {
      await supabase.from("notifications").insert(notifications);
    }

    // Log activity
    await supabase.from("activity_log").insert({
      entity_type: "invoices",
      entity_id: overdueInvoices[0].id,
      action: "invoice_chaser_run",
      metadata: {
        overdue_count: overdueInvoices.length,
        total_overdue: overdueInvoices.reduce((sum, inv) => sum + Number(inv.total), 0),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        count: overdueInvoices.length,
        totalOverdue: overdueInvoices.reduce((sum, inv) => sum + Number(inv.total), 0),
        notificationsSent: notifications.length,
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
