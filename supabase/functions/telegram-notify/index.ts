import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";

async function sendTelegramMessage(chatId: string, text: string): Promise<{ ok: boolean; description?: string }> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { ok: false, description: "TELEGRAM_BOT_TOKEN not configured" };
  }
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
  return res.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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

  try {
    const body = await req.json();
    const { action, notificationIds, chatId, message } = body;

    // Direct test message
    if (action === "test") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("telegram_chat_id, display_name")
        .eq("id", user.id)
        .single();

      const targetChatId = chatId ?? profile?.telegram_chat_id;
      if (!targetChatId) {
        return new Response(
          JSON.stringify({ error: "No Telegram Chat ID set. Add it in Settings → Profile." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const result = await sendTelegramMessage(
        targetChatId,
        `🟢 <b>NDG Hub</b> — Test notification\n\nHello ${profile?.display_name ?? "there"}! Your Telegram notifications are working correctly.`,
      );

      return new Response(
        JSON.stringify({ sent: result.ok, error: result.ok ? undefined : result.description }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Dispatch pending notifications
    if (action === "dispatch") {
      // Get user's profile (telegram_chat_id + notification_preferences)
      const { data: profile } = await supabase
        .from("profiles")
        .select("telegram_chat_id, notification_preferences")
        .eq("id", user.id)
        .single();

      if (!profile?.telegram_chat_id) {
        return new Response(
          JSON.stringify({ dispatched: 0, reason: "No telegram_chat_id set" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const prefs = (profile.notification_preferences ?? {}) as Record<string, { telegram?: boolean }>;

      // Find unsent notifications for this user
      let query = supabase
        .from("notifications")
        .select("id, type, title, body, created_at")
        .eq("user_id", user.id)
        .eq("telegram_sent", false)
        .order("created_at", { ascending: true })
        .limit(20);

      // Filter by specific IDs if provided
      if (notificationIds?.length) {
        query = query.in("id", notificationIds);
      }

      const { data: pending } = await query;
      if (!pending?.length) {
        return new Response(
          JSON.stringify({ dispatched: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      let dispatched = 0;
      const sentIds: string[] = [];

      for (const notif of pending) {
        const typePrefs = prefs[notif.type] ?? { telegram: false };
        if (!typePrefs.telegram) continue;

        const text = `<b>NDG Hub</b> — ${notif.title}${notif.body ? `\n\n${notif.body}` : ""}`;
        const result = await sendTelegramMessage(profile.telegram_chat_id, text);
        if (result.ok) {
          dispatched++;
          sentIds.push(notif.id);
        }
      }

      if (sentIds.length) {
        await supabase
          .from("notifications")
          .update({ telegram_sent: true })
          .in("id", sentIds);
      }

      return new Response(
        JSON.stringify({ dispatched }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Direct message to a specific chat (admin use)
    if (action === "send" && chatId && message) {
      const result = await sendTelegramMessage(chatId, message);
      return new Response(
        JSON.stringify({ sent: result.ok, error: result.ok ? undefined : result.description }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Use: test, dispatch, send" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
