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
const GCAL_SCOPE = "https://www.googleapis.com/auth/calendar";

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

  // Handle OAuth callback (GET with ?code= from Google)
  const url = new URL(req.url);
  if (req.method === "GET" && url.searchParams.has("code")) {
    const code = url.searchParams.get("code")!;
    const userId = url.searchParams.get("state");
    if (!userId) {
      return new Response("Missing state", { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/gcal-sync`;
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
        headers: { ...corsHeaders, Location: `${APP_URL}/meetings?gcal=error&msg=${encodeURIComponent(tokenData.error_description ?? tokenData.error)}` },
      });
    }

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profileData = await profileRes.json();

    await supabase.from("oauth_tokens").upsert({
      user_id: userId,
      provider: "google_calendar",
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token ?? null,
      expires_at: new Date(Date.now() + (tokenData.expires_in ?? 3600) * 1000).toISOString(),
      scope: tokenData.scope ?? GCAL_SCOPE,
      connected_email: profileData.email ?? null,
    }, { onConflict: "user_id,provider" });

    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: `${APP_URL}/meetings?gcal=connected` },
    });
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
    const body = req.method === "POST" ? await req.json() : {};
    const action = body.action ?? url.searchParams.get("action");

    if (action === "auth-url") {
      if (!GOOGLE_CLIENT_ID) {
        return new Response(
          JSON.stringify({ error: "Google OAuth not configured. Set GOOGLE_CLIENT_ID env var." }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/gcal-sync`;
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: GCAL_SCOPE,
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
        .select("connected_email, updated_at")
        .eq("user_id", user.id)
        .eq("provider", "google_calendar")
        .single();
      return new Response(
        JSON.stringify({ connected: !!token, email: token?.connected_email ?? null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "disconnect") {
      await supabase.from("oauth_tokens").delete().eq("user_id", user.id).eq("provider", "google_calendar");
      return new Response(
        JSON.stringify({ disconnected: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "create-event") {
      const { meetingId } = body;
      if (!meetingId) {
        return new Response(JSON.stringify({ error: "meetingId required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: token, error: tokenError } = await supabase
        .from("oauth_tokens")
        .select("*")
        .eq("user_id", user.id)
        .eq("provider", "google_calendar")
        .single();
      if (tokenError || !token) {
        return new Response(JSON.stringify({ error: "Google Calendar not connected." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: meeting } = await supabase
        .from("meetings")
        .select("*, organisations(name)")
        .eq("id", meetingId)
        .single();
      if (!meeting) {
        return new Response(JSON.stringify({ error: "Meeting not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const accessToken = await refreshAccessToken(supabase, token);
      const startTime = new Date(meeting.scheduled_at);
      const endTime = new Date(startTime.getTime() + (meeting.duration_minutes ?? 60) * 60_000);

      const eventBody: any = {
        summary: meeting.title,
        description: meeting.notes ?? "",
        start: { dateTime: startTime.toISOString(), timeZone: "Europe/London" },
        end: { dateTime: endTime.toISOString(), timeZone: "Europe/London" },
      };
      if (meeting.location) eventBody.location = meeting.location;

      let gcalRes: Response;
      let method = "POST";
      let gcalUrl = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

      if (meeting.gcal_event_id) {
        method = "PUT";
        gcalUrl = `${gcalUrl}/${meeting.gcal_event_id}`;
      }

      gcalRes = await fetch(gcalUrl, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      });

      const gcalData = await gcalRes.json();
      if (!gcalRes.ok) throw new Error(gcalData.error?.message ?? "Google Calendar API error");

      // Save gcal_event_id back to meeting
      await supabase.from("meetings")
        .update({ gcal_event_id: gcalData.id, updated_at: new Date().toISOString() })
        .eq("id", meetingId);

      return new Response(
        JSON.stringify({ gcalEventId: gcalData.id, htmlLink: gcalData.htmlLink }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "delete-event") {
      const { meetingId } = body;
      const { data: meeting } = await supabase
        .from("meetings").select("gcal_event_id").eq("id", meetingId).single();
      if (!meeting?.gcal_event_id) {
        return new Response(JSON.stringify({ error: "No Google Calendar event linked." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: token } = await supabase
        .from("oauth_tokens").select("*")
        .eq("user_id", user.id).eq("provider", "google_calendar").single();
      if (!token) {
        return new Response(JSON.stringify({ error: "Google Calendar not connected." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const accessToken = await refreshAccessToken(supabase, token);
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${meeting.gcal_event_id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } },
      );
      await supabase.from("meetings")
        .update({ gcal_event_id: null, updated_at: new Date().toISOString() })
        .eq("id", meetingId);

      return new Response(JSON.stringify({ deleted: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Use: auth-url, status, disconnect, create-event, delete-event" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
