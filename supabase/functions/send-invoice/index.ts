import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildInvoiceHtml(invoice: any, items: any[], org: any, project: any): string {
  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${item.description ?? item.service_name ?? "Service"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">£${Number(item.unit_price ?? 0).toFixed(2)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity ?? 1}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">£${Number(item.total ?? 0).toFixed(2)}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${invoice.invoice_number}</title>
</head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;background:#f9fafb;color:#111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr>
          <td style="background:#1e293b;padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">NDG Hub</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">Neurodiversity Learning &amp; Development</p>
                </td>
                <td align="right">
                  <p style="margin:0;font-size:28px;font-weight:700;color:#f8fafc;">INVOICE</p>
                  <p style="margin:4px 0 0;font-size:15px;color:#94a3b8;">${invoice.invoice_number}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Meta info -->
        <tr>
          <td style="padding:32px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Billed To</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${org?.name ?? "Client"}</p>
                  ${org?.email ? `<p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${org.email}</p>` : ""}
                  ${org?.address ? `<p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${org.address}</p>` : ""}
                </td>
                <td width="50%" align="right" style="vertical-align:top;">
                  <table cellpadding="0" cellspacing="0" align="right">
                    <tr>
                      <td style="padding:2px 12px 2px 0;font-size:12px;color:#6b7280;">Issue Date</td>
                      <td style="padding:2px 0;font-size:12px;font-weight:600;color:#111827;">${invoice.issue_date ?? "—"}</td>
                    </tr>
                    <tr>
                      <td style="padding:2px 12px 2px 0;font-size:12px;color:#6b7280;">Due Date</td>
                      <td style="padding:2px 0;font-size:12px;font-weight:600;color:#dc2626;">${invoice.due_date ?? "—"}</td>
                    </tr>
                    <tr>
                      <td style="padding:2px 12px 2px 0;font-size:12px;color:#6b7280;">Project</td>
                      <td style="padding:2px 0;font-size:12px;font-weight:600;color:#111827;">${project?.name ?? "—"}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Line items -->
        <tr>
          <td style="padding:24px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Description</th>
                  <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Unit Price</th>
                  <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
                  <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
            </table>
          </td>
        </tr>

        <!-- Totals -->
        <tr>
          <td style="padding:16px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="60%"></td>
                <td width="40%">
                  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
                    <tr style="background:#f8fafc;">
                      <td style="padding:8px 12px;font-size:13px;color:#6b7280;">Subtotal</td>
                      <td style="padding:8px 12px;font-size:13px;font-weight:600;text-align:right;">£${Number(invoice.subtotal ?? 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 12px;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;">VAT (20%)</td>
                      <td style="padding:8px 12px;font-size:13px;font-weight:600;text-align:right;border-top:1px solid #e5e7eb;">£${Number(invoice.vat ?? 0).toFixed(2)}</td>
                    </tr>
                    <tr style="background:#1e293b;">
                      <td style="padding:10px 12px;font-size:14px;font-weight:700;color:#ffffff;">Total Due</td>
                      <td style="padding:10px 12px;font-size:14px;font-weight:700;color:#ffffff;text-align:right;">£${Number(invoice.total ?? 0).toFixed(2)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:32px 40px;border-top:1px solid #e5e7eb;margin-top:24px;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
              NDG Hub · neurodiversity learning &amp; development consultancy<br/>
              Please include invoice number <strong>${invoice.invoice_number}</strong> with your payment.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
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

    const { invoiceId } = await req.json();
    if (!invoiceId) {
      return new Response(JSON.stringify({ error: "invoiceId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch invoice with items
    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (fetchError || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (invoice.status !== "draft") {
      return new Response(JSON.stringify({ error: "Only draft invoices can be sent" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch invoice items
    const { data: items } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("created_at");

    // Fetch project + organisation
    const { data: project } = await supabase
      .from("projects")
      .select("name, organisation_id, owner_id")
      .eq("id", invoice.project_id)
      .single();

    const { data: org } = project?.organisation_id
      ? await supabase.from("organisations").select("name, email, address").eq("id", project.organisation_id).single()
      : { data: null };

    // Fetch primary contact email (fallback to org email)
    const { data: primaryContact } = project?.organisation_id
      ? await supabase.from("contacts")
          .select("email, name")
          .eq("organisation_id", project.organisation_id)
          .eq("is_primary", true)
          .single()
      : { data: null };

    const recipientEmail = primaryContact?.email ?? org?.email ?? null;

    const issueDate = new Date().toISOString().split("T")[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Update invoice status → sent
    const { data: updated, error: updateError } = await supabase
      .from("invoices")
      .update({
        status: "sent",
        issue_date: issueDate,
        due_date: dueDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Send email via Resend if API key is configured and recipient exists
    const resendKey = Deno.env.get("RESEND_API_KEY");
    let emailSent = false;
    let emailError: string | null = null;

    if (resendKey && recipientEmail) {
      const fromAddress = Deno.env.get("EMAIL_FROM") ?? "invoices@ndg-hub.io";
      const htmlBody = buildInvoiceHtml(updated, items ?? [], org, project);

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `NDG Hub <${fromAddress}>`,
          to: [recipientEmail],
          subject: `Invoice ${invoice.invoice_number} from NDG Hub`,
          html: htmlBody,
        }),
      });

      if (emailRes.ok) {
        emailSent = true;
      } else {
        const errBody = await emailRes.json().catch(() => ({}));
        emailError = errBody.message ?? `Resend API error: ${emailRes.status}`;
        // Don't throw — invoice is still marked sent in DB; just note the email failure
      }
    } else if (!resendKey) {
      emailError = "RESEND_API_KEY not configured — invoice marked as sent without email dispatch";
    } else {
      emailError = "No recipient email address found for this organisation";
    }

    // Activity log
    await supabase.from("activity_log").insert({
      user_id: user.id,
      entity_type: "invoice",
      entity_id: invoiceId,
      action: "status_changed",
      metadata: {
        from: "draft",
        to: "sent",
        issue_date: issueDate,
        due_date: dueDate,
        email_sent: emailSent,
        recipient: recipientEmail,
      },
    });

    // Notify project owner
    if (project?.owner_id) {
      await supabase.from("notifications").insert({
        user_id: project.owner_id,
        type: "invoice_overdue",
        title: "Invoice sent",
        body: `Invoice ${invoice.invoice_number} sent${emailSent ? ` to ${recipientEmail}` : ""}. Due: ${dueDate}`,
        entity_type: "invoice",
        entity_id: invoiceId,
      });
    }

    return new Response(JSON.stringify({ data: updated, emailSent, emailError }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
