import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") ?? "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "";
const APP_URL = Deno.env.get("APP_URL") ?? "http://localhost:5173";
const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

async function refreshAccessToken(supabase: any, token: any): Promise<string> {
  if (new Date(token.expires_at) > new Date(Date.now() + 60_000)) {
    return token.access_token;
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: token.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Token refresh failed: " + (data.error ?? "unknown"));
  await supabase.from("oauth_tokens").update({
    access_token: data.access_token,
    expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  }).eq("id", token.id);
  return data.access_token;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Handle OAuth callback redirect (GET with ?code= from Google)
  const url = new URL(req.url);
  if (req.method === "GET" && url.searchParams.has("code")) {
    const code = url.searchParams.get("code")!;
    const userId = url.searchParams.get("state");
    if (!userId) {
      return new Response("Missing state parameter", { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/gmail-sync`;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: `${APP_URL}/emails?gmail=error&msg=${encodeURIComponent(tokenData.error_description ?? tokenData.error)}` },
      });
    }

    // Fetch connected Gmail address
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profileData = await profileRes.json();

    await supabase.from("oauth_tokens").upsert({
      user_id: userId,
      provider: "google_gmail",
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token ?? null,
      expires_at: new Date(Date.now() + (tokenData.expires_in ?? 3600) * 1000).toISOString(),
      scope: tokenData.scope ?? GMAIL_SCOPE,
      connected_email: profileData.email ?? null,
    }, { onConflict: "user_id,provider" });

    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: `${APP_URL}/emails?gmail=connected` },
    });
  }

  // All other requests require auth
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
    const body = req.method === "POST" ? await req.json() : {};
    const action = body.action ?? url.searchParams.get("action");

    if (action === "auth-url") {
      if (!GOOGLE_CLIENT_ID) {
        return new Response(
          JSON.stringify({ error: "Google OAuth not configured. Set GOOGLE_CLIENT_ID env var." }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/gmail-sync`;
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: GMAIL_SCOPE,
        access_type: "offline",
        prompt: "consent",
        state: user.id,
      });
      return new Response(
        JSON.stringify({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "status") {
      const { data: token } = await supabase
        .from("oauth_tokens")
        .select("connected_email, updated_at, expires_at")
        .eq("user_id", user.id)
        .eq("provider", "google_gmail")
        .single();
      return new Response(
        JSON.stringify({ connected: !!token, email: token?.connected_email ?? null, lastSync: token?.updated_at ?? null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "disconnect") {
      await supabase.from("oauth_tokens").delete().eq("user_id", user.id).eq("provider", "google_gmail");
      return new Response(
        JSON.stringify({ disconnected: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "sync") {
      const { data: token, error: tokenError } = await supabase
        .from("oauth_tokens")
        .select("*")
        .eq("user_id", user.id)
        .eq("provider", "google_gmail")
        .single();

      if (tokenError || !token) {
        return new Response(
          JSON.stringify({ error: "Gmail not connected. Please connect your Gmail account first." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const accessToken = await refreshAccessToken(supabase, token);

      // Fetch last 50 messages from last 14 days
      const listRes = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=newer_than:14d",
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const listData = await listRes.json();

      if (!listData.messages?.length) {
        return new Response(
          JSON.stringify({ synced: 0, message: "No new messages found." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      let synced = 0;
      const messages: { id: string }[] = listData.messages.slice(0, 50);

      // Batch fetch message metadata (10 at a time)
      for (let i = 0; i < messages.length; i += 10) {
        const batch = messages.slice(i, i + 10);
        const details = await Promise.all(
          batch.map(async (msg) => {
            const res = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata` +
              `&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
              { headers: { Authorization: `Bearer ${accessToken}` } },
            );
            return res.json();
          }),
        );

        const rows = details.map((detail: any) => {
          const hdrs: Record<string, string> = {};
          for (const h of detail.payload?.headers ?? []) hdrs[h.name.toLowerCase()] = h.value;
          return {
            gmail_id: detail.id,
            thread_id: detail.threadId ?? null,
            subject: hdrs.subject ?? "(no subject)",
            from_address: hdrs.from ?? null,
            to_addresses: hdrs.to ? [hdrs.to] : [],
            snippet: detail.snippet?.slice(0, 300) ?? null,
            received_at: hdrs.date ? new Date(hdrs.date).toISOString() : new Date().toISOString(),
            synced_at: new Date().toISOString(),
          };
        }).filter((r) => r.gmail_id);

        const { error: upsertError } = await supabase
          .from("emails")
          .upsert(rows, { onConflict: "gmail_id", ignoreDuplicates: false });

        if (!upsertError) synced += rows.length;
      }

      // Update token's updated_at to track last sync time
      await supabase.from("oauth_tokens").update({ updated_at: new Date().toISOString() })
        .eq("id", token.id);

      return new Response(
        JSON.stringify({ synced, message: `Synced ${synced} emails.` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Use: auth-url, status, disconnect, sync" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
