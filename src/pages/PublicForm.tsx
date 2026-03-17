import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm as useFormData, useFormResponses, useUpdateForm } from '@/hooks/useForms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSubmitFormResponse } from '@/hooks/useForms';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2 } from 'lucide-react';

export default function PublicForm() {
  const { formId } = useParams<{ formId: string }>();
  const { data: form, isLoading } = useFormData(formId);
  const submitResponse = useSubmitFormResponse();
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Skeleton className="h-96 w-full max-w-lg" /></div>;
  if (!form || !form.active) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-text-2">Form not found or inactive.</p></div>;

  const fields = (form.fields as any[]) ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitResponse.mutateAsync({ form_id: form.id, data: answers });
      setSubmitted(true);
    } catch (err: any) { toast.error(err.message); }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-md">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="pt-8 space-y-md">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
            <h2 className="text-section-title">Thank you!</h2>
            <p className="text-body text-text-2">Your response has been submitted.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-md flex justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{form.title}</CardTitle>
          {form.description && <CardDescription>{form.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-lg">
            {fields.map((field: any) => (
              <div key={field.id} className="space-y-xs">
                <Label>{field.label}{field.required && ' *'}</Label>
                {field.type === 'textarea' ? (
                  <Textarea value={answers[field.id] ?? ''} onChange={(e) => setAnswers((p) => ({ ...p, [field.id]: e.target.value }))} required={field.required} />
                ) : field.type === 'rating' ? (
                  <div className="flex gap-sm">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setAnswers((p) => ({ ...p, [field.id]: n }))}
                        className={`h-10 w-10 rounded-md border text-body font-medium transition-colors ${answers[field.id] === n ? 'bg-primary text-primary-foreground' : 'bg-surface hover:bg-accent'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                ) : (
                  <Input value={answers[field.id] ?? ''} onChange={(e) => setAnswers((p) => ({ ...p, [field.id]: e.target.value }))} required={field.required} />
                )}
              </div>
            ))}
            <Button type="submit" className="w-full" disabled={submitResponse.isPending}>
              {submitResponse.isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
