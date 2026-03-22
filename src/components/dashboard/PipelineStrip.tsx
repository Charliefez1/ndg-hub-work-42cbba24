import { getStatusBadgeClasses, formatStatus } from '@/lib/status-colors';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const PROJECT_STAGES = [
  'contracting', 'project_planning', 'session_planning',
  'content_development', 'content_review', 'ready',
  'delivery', 'feedback_analytics', 'closed',
];

interface PipelineStripProps {
  projects: { status: string }[] | undefined;
}

export function PipelineStrip({ projects }: PipelineStripProps) {
  if (!projects?.length) return null;

  const counts: Record<string, number> = {};
  for (const p of projects) {
    counts[p.status] = (counts[p.status] || 0) + 1;
  }

  const activeStages = PROJECT_STAGES.filter(s => counts[s]);

  if (!activeStages.length) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1.5 flex-wrap animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mr-1">Pipeline</span>
        {activeStages.map((stage) => (
          <Tooltip key={stage}>
            <TooltipTrigger asChild>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium cursor-default ${getStatusBadgeClasses(stage, 'project')}`}>
                <span className="tabular-nums">{counts[stage]}</span>
                <span className="hidden sm:inline">{formatStatus(stage)}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {counts[stage]} project{counts[stage] > 1 ? 's' : ''} in {formatStatus(stage)}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
