import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { FolderKanban, CheckSquare, Briefcase, FileText, Users, FileSignature, CalendarDays, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const entityIcons: Record<string, typeof FolderKanban> = {
  projects: FolderKanban,
  tasks: CheckSquare,
  deliveries: Briefcase,
  invoices: FileText,
  organisations: Users,
  contracts: FileSignature,
  meetings: CalendarDays,
};

const entityLinks: Record<string, string> = {
  projects: '/projects',
  tasks: '/tasks',
  deliveries: '/workshops',
  invoices: '/invoices',
  organisations: '/clients',
  contracts: '/contracts',
  meetings: '/meetings',
};

function formatAction(action: string, entityType: string): string {
  const entityLabel = entityType.replace(/s$/, '');
  switch (action) {
    case 'INSERT': return `New ${entityLabel} created`;
    case 'UPDATE': return `${entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1)} updated`;
    case 'DELETE': return `${entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1)} removed`;
    default: return `${action} on ${entityLabel}`;
  }
}

export function ActivityFeed() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['activity-feed-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card className="shadow-sm animate-fade-in-up">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-muted rounded-lg" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm animate-fade-in-up">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[hsl(var(--info)/0.1)] flex items-center justify-center">
            <Activity className="h-3.5 w-3.5 text-[hsl(var(--info))]" />
          </div>
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0.5">
        {!activities?.length ? (
          <p className="text-muted-foreground text-sm py-3 text-center">No recent activity</p>
        ) : (
          activities.map((a) => {
            const Icon = entityIcons[a.entity_type] ?? Activity;
            const link = entityLinks[a.entity_type];
            const linkTo = link ? `${link}/${a.entity_id}` : '#';

            return (
              <Link
                key={a.id}
                to={linkTo}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/60 transition-colors group"
              >
                <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={1.75} />
                <span className="text-sm font-medium truncate flex-1 group-hover:text-primary transition-colors">
                  {formatAction(a.action, a.entity_type)}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {a.created_at ? formatDistanceToNow(new Date(a.created_at), { addSuffix: true }) : ''}
                </span>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
