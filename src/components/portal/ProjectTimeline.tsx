import { cn } from '@/lib/utils';

const STAGES = [
  'contracting', 'project_planning', 'session_planning',
  'content_development', 'content_review', 'ready',
  'delivery', 'feedback_analytics', 'closed',
];

interface ProjectTimelineProps {
  status: string;
}

export function ProjectTimeline({ status }: ProjectTimelineProps) {
  const currentIdx = STAGES.indexOf(status);

  return (
    <div className="flex items-center gap-0.5 w-full mt-2">
      {STAGES.map((stage, i) => {
        const isCompleted = i < currentIdx;
        const isCurrent = i === currentIdx;

        return (
          <div key={stage} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-center">
              <div
                className={cn(
                  'h-1.5 w-full rounded-full transition-all duration-300',
                  isCompleted ? 'bg-primary' : isCurrent ? 'bg-primary animate-pulse' : 'bg-muted'
                )}
              />
            </div>
            {isCurrent && (
              <span className="text-[9px] font-medium text-primary capitalize truncate max-w-full">
                {stage.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
