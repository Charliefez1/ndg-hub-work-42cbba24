type StatusColorMap = Record<string, string>;

const projectStatusColors: StatusColorMap = {
  contracting: 'warning',
  project_planning: 'info',
  session_planning: 'cyan',
  content_review: 'purple',
  delivery: 'success',
  feedback_analytics: 'pink',
  closed: 'text-3',
};

const deliveryStatusColors: StatusColorMap = {
  planning: 'text-2',
  scheduled: 'warning',
  in_progress: 'info',
  delivered: 'purple',
  follow_up: 'cyan',
  complete: 'success',
  cancelled: 'destructive',
};

const invoiceStatusColors: StatusColorMap = {
  draft: 'text-3',
  sent: 'info',
  viewed: 'purple',
  paid: 'success',
  overdue: 'destructive',
};

const taskStatusColors: StatusColorMap = {
  todo: 'text-3',
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
  draft: 'text-3',
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
 * Use in badge/tag components — never hard-code colours in JSX.
 */
export function getStatusColor(status: string, entity: StatusEntity): string {
  return entityColorMaps[entity]?.[status] ?? 'text-3';
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
    'text-2': 'bg-muted text-text-2',
    'text-3': 'bg-muted text-text-3',
  };

  return colorClassMap[color] ?? 'bg-muted text-text-3';
}

/** Human-readable label for a status value */
export function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
