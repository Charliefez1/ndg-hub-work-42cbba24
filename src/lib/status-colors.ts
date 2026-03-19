type StatusColorMap = Record<string, string>;

const projectStatusColors: StatusColorMap = {
  contracting: 'warning',
  project_planning: 'info',
  session_planning: 'cyan',
  content_review: 'purple',
  delivery: 'success',
  feedback_analytics: 'pink',
  closed: 'neutral',
};

const deliveryStatusColors: StatusColorMap = {
  planning: 'neutral',
  scheduled: 'warning',
  in_progress: 'info',
  delivered: 'purple',
  follow_up: 'cyan',
  complete: 'success',
  cancelled: 'destructive',
};

const invoiceStatusColors: StatusColorMap = {
  draft: 'neutral',
  sent: 'info',
  viewed: 'purple',
  paid: 'success',
  overdue: 'destructive',
};

const taskStatusColors: StatusColorMap = {
  todo: 'neutral',
  in_progress: 'info',
  blocked: 'destructive',
  review: 'purple',
  done: 'success',
};

const neuroPhaseColors: StatusColorMap = {
  needs: 'warning',
  engage: 'info',
  understand: 'purple',
  realise: 'success',
  ongoing: 'cyan',
};

const contractStatusColors: StatusColorMap = {
  draft: 'neutral',
  sent: 'info',
  signed: 'success',
  expired: 'warning',
  cancelled: 'destructive',
};

const entityColorMaps: Record<string, StatusColorMap> = {
  project: projectStatusColors,
  delivery: deliveryStatusColors,
  invoice: invoiceStatusColors,
  task: taskStatusColors,
  neuro_phase: neuroPhaseColors,
  contract: contractStatusColors,
};

export type StatusEntity = keyof typeof entityColorMaps;

/**
 * Returns a semantic colour token for a given entity + status.
 */
export function getStatusColor(status: string, entity: StatusEntity): string {
  return entityColorMaps[entity]?.[status] ?? 'neutral';
}

/**
 * Returns Tailwind classes for a status badge (bg at 15% opacity + text colour).
 */
export function getStatusBadgeClasses(status: string, entity: StatusEntity): string {
  const color = getStatusColor(status, entity);

  const colorClassMap: Record<string, string> = {
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    info: 'bg-info/15 text-info',
    destructive: 'bg-destructive/15 text-destructive',
    purple: 'bg-purple/15 text-purple',
    cyan: 'bg-cyan/15 text-cyan',
    pink: 'bg-pink/15 text-pink',
    neutral: 'bg-muted text-muted-foreground',
  };

  return colorClassMap[color] ?? 'bg-muted text-muted-foreground';
}

/** Human-readable label for a status value */
export function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
