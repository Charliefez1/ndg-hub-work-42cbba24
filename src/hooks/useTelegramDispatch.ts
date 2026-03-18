import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Automatically dispatches Telegram messages for new unread notifications
 * when the user has a telegram_chat_id set and has telegram enabled for that notification type.
 *
 * Runs once on mount and whenever the window regains focus.
 * The edge function deduplicates by checking telegram_sent=false.
 */
export function useTelegramDispatch() {
  const { user } = useAuth();
  const lastDispatch = useRef<number>(0);

  const dispatch = async () => {
    if (!user?.id) return;
    // Throttle to once per 60 seconds
    if (Date.now() - lastDispatch.current < 60_000) return;
    lastDispatch.current = Date.now();

    try {
      // Check if user has telegram_chat_id before making the edge function call
      const { data: profile } = await supabase
        .from('profiles')
        .select('telegram_chat_id')
        .eq('id', user.id)
        .single();

      if (!profile?.telegram_chat_id) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.functions.invoke('telegram-notify', {
        body: { action: 'dispatch' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
    } catch {
      // Silent fail — Telegram dispatch is best-effort
    }
  };

  useEffect(() => {
    dispatch();
    const onFocus = () => dispatch();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user?.id]);
}
