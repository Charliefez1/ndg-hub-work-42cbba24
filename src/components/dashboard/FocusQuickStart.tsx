import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Target, Zap, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getStatusBadgeClasses } from '@/lib/status-colors';

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

export function FocusQuickStart() {
  const { user } = useAuth();

  const { data: dailyState } = useQuery({
    queryKey: ['daily-state-today', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('daily_states')
        .select('*')
        .eq('user_id', user!.id)
        .eq('date', today)
        .maybeSingle();
      return data;
    },
  });

  const { data: topTasks } = useQuery({
    queryKey: ['focus-tasks-dashboard', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, priority, due_date, status')
        .eq('assignee', user!.id)
        .in('status', ['todo', 'in_progress'])
        .eq('is_template', false)
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(20);
      if (error) throw error;
      return (data ?? [])
        .sort((a, b) => (PRIORITY_ORDER[a.priority ?? 'medium'] ?? 2) - (PRIORITY_ORDER[b.priority ?? 'medium'] ?? 2))
        .slice(0, 3);
    },
  });

  const moodEmojis: Record<string, string> = {
    great: '🔥', good: '😊', okay: '😐', low: '😔', stressed: '😰',
  };

  return (
    <Card className="shadow-sm animate-fade-in-up" style={{ animationDelay: '120ms' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[hsl(var(--purple)/0.1)] flex items-center justify-center">
              <Target className="h-3.5 w-3.5 text-[hsl(var(--purple))]" />
            </div>
            Focus Mode
            {dailyState?.mood && (
              <span className="text-base ml-1" title={`Mood: ${dailyState.mood}`}>
                {moodEmojis[dailyState.mood] ?? ''}
              </span>
            )}
          </CardTitle>
          {dailyState && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {dailyState.energy_level != null && (
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" /> {dailyState.energy_level}/5
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {!topTasks?.length ? (
          <p className="text-muted-foreground text-sm py-3 text-center">No tasks assigned — enjoy the calm! 🧘</p>
        ) : (
          <>
            {topTasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-2 truncate">
                  <Badge className={`${getStatusBadgeClasses(t.priority ?? 'medium', 'task')} text-[10px] px-1.5`}>
                    {t.priority ?? 'medium'}
                  </Badge>
                  <span className="text-sm font-medium truncate">{t.title}</span>
                </div>
                {t.due_date && (
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{t.due_date}</span>
                )}
              </div>
            ))}
            <Link to="/tasks" className="block mt-2">
              <Button variant="outline" size="sm" className="w-full gap-1.5">
                <Target className="h-3.5 w-3.5" /> Start Focus Session <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
