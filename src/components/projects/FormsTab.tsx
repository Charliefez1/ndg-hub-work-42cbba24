import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useForms } from '@/hooks/useForms';
import { useDeliveries } from '@/hooks/useDeliveries';
import { ClipboardList } from 'lucide-react';

interface FormsTabProps {
  projectId: string;
}

export function FormsTab({ projectId }: FormsTabProps) {
  const { data: forms } = useForms();
  const { data: deliveries } = useDeliveries(projectId);

  const projectForms = forms?.filter((f) => f.project_id === projectId) ?? [];

  // Map delivery satisfaction scores
  const deliveryScores: Record<string, number | null> = {};
  for (const d of deliveries ?? []) {
    deliveryScores[d.id] = d.satisfaction_score;
  }

  if (!projectForms.length) {
    return (
      <div className="text-center py-4">
        <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground mb-2" strokeWidth={1.25} />
        <p className="text-muted-foreground">No forms linked to this project yet.</p>
        <p className="text-caption text-muted-foreground mt-1">Forms are created automatically when deliveries are scaffolded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {projectForms.map((form) => {
        const score = form.delivery_id ? deliveryScores[form.delivery_id] : null;
        return (
          <Link
            key={form.id}
            to={`/forms/${form.id}`}
            className="block bg-card rounded-lg border p-3 hover:border-primary transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{form.title}</p>
                <p className="text-caption text-muted-foreground mt-0.5">
                  {form.type} · Kirkpatrick L{form.kirkpatrick_level || '—'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {score !== null && score !== undefined && (
                  <Badge variant="outline" className="text-success">
                    {score}/10
                  </Badge>
                )}
                <Badge variant="outline">{form.active ? 'Active' : 'Inactive'}</Badge>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
