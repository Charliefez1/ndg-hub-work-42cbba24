-- =============================================================
-- PRD-04/06/07: Integrations, Notification Preferences, Telegram
-- =============================================================

-- 1. notification_preferences JSONB on profiles (per-type in-app + telegram flags)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT jsonb_build_object(
    'task_assigned',     jsonb_build_object('in_app', true, 'telegram', false),
    'delivery_reminder', jsonb_build_object('in_app', true, 'telegram', false),
    'invoice_overdue',   jsonb_build_object('in_app', true, 'telegram', false),
    'form_response',     jsonb_build_object('in_app', true, 'telegram', false),
    'project_status',    jsonb_build_object('in_app', true, 'telegram', false)
  );

-- 2. telegram_sent tracking on notifications
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS telegram_sent BOOLEAN DEFAULT false;

-- 3. synced_at on emails (tracks last Gmail sync timestamp per row)
ALTER TABLE public.emails
  ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ DEFAULT now();

-- 4. oauth_tokens table — stores Google OAuth access/refresh tokens per user per provider
CREATE TABLE IF NOT EXISTS public.oauth_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL CHECK (provider IN ('google_gmail', 'google_calendar')),
  access_token    TEXT,
  refresh_token   TEXT,
  expires_at      TIMESTAMPTZ,
  scope           TEXT,
  connected_email TEXT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, provider)
);

ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_manage_own_oauth_tokens" ON public.oauth_tokens
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "admin_read_oauth_tokens" ON public.oauth_tokens
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_oauth_tokens_updated_at
  BEFORE UPDATE ON public.oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Index: quickly find unsent Telegram notifications for a user
CREATE INDEX IF NOT EXISTS idx_notifications_telegram_pending
  ON public.notifications (user_id, telegram_sent)
  WHERE telegram_sent = false;

-- 6. Index: emails by gmail_id for fast upsert
CREATE INDEX IF NOT EXISTS idx_emails_gmail_id
  ON public.emails (gmail_id)
  WHERE gmail_id IS NOT NULL;
