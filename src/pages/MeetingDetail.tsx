import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateMeeting, useDeleteMeeting } from '@/hooks/useMeetings';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { ArrowLeft, Calendar, Clock, MapPin, Trash2, FileText, Brain, MessageSquare, Sparkles, Loader2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export default function MeetingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateMeeting = useUpdateMeeting();
  const deleteMeeting = useDeleteMeeting();
  const [analysing, setAnalysing] = useState(false);
  const [prepping, setPrepping] = useState(false);

  const { data: meeting, isLoading } = useQuery({
    queryKey: ['meeting', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meetings')
        .select('*, organisations(name), projects(name), contacts(name)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [editingTranscript, setEditingTranscript] = useState(false);
  const [transcript, setTranscript] = useState('');

  if (isLoading) return <AppShell><PageSkeleton variant="detail" /></AppShell>;
  if (!meeting) return <AppShell><p className="text-center text-muted-foreground py-8">Meeting not found.</p></AppShell>;

  const handleDelete = async () => {
    if (!confirm('Delete this meeting?')) return;
    await deleteMeeting.mutateAsync(meeting.id);
    toast.success('Meeting deleted');
    navigate('/meetings');
  };

  const handleSaveNotes = async () => {
    await updateMeeting.mutateAsync({ id: meeting.id, notes });
    setEditingNotes(false);
    toast.success('Notes saved');
  };

  const handleSaveTranscript = async () => {
    await updateMeeting.mutateAsync({ id: meeting.id, transcript });
    setEditingTranscript(false);
    toast.success('Transcript saved');
  };

  const handleAnalyse = async () => {
    setAnalysing(true);
    try {
      const { data, error } = await supabase.functions.invoke('superagent-post-meeting', {
        body: { meetingId: meeting.id },
      });
      if (error) throw error;
      toast.success(`Analysis complete — ${data.analysis?.action_items?.length || 0} action items created`);
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
    } catch (err: any) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setAnalysing(false);
    }
  };

  const handleDiscoveryPrep = async () => {
    setPrepping(true);
    try {
      const { data, error } = await supabase.functions.invoke('superagent-discovery-prep', {
        body: { meetingId: meeting.id },
      });
      if (error) throw error;
      toast.success('Discovery brief generated');
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
    } catch (err: any) {
      toast.error(err.message || 'Prep failed');
    } finally {
      setPrepping(false);
    }
  };

  const analysis = meeting.analysis as Record<string, any> | null;

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/meetings')}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex-1">
            <h1 className="text-page-title">{meeting.title}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{format(new Date(meeting.scheduled_at), 'dd MMM yyyy, HH:mm')}</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{meeting.duration_minutes}min</span>
              {meeting.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{meeting.location}</span>}
            </div>
          </div>
          <Badge variant="secondary">{meeting.meeting_type}</Badge>
          <Button variant="destructive" size="icon" onClick={handleDelete}><Trash2 className="h-4 w-4" /></Button>
        </div>

        {/* Linked entities */}
        <div className="flex flex-wrap gap-2 text-sm">
          {(meeting as any).organisations?.name && (
            <Badge variant="outline">Client: {(meeting as any).organisations.name}</Badge>
          )}
          {(meeting as any).projects?.name && (
            <Link to={`/projects/${meeting.project_id}`}>
              <Badge variant="outline" className="hover:bg-accent cursor-pointer">Project: {(meeting as any).projects.name}</Badge>
            </Link>
          )}
          {(meeting as any).contacts?.name && (
            <Badge variant="outline">Contact: {(meeting as any).contacts.name}</Badge>
          )}
        </div>

        <Tabs defaultValue="notes">
          <TabsList>
            <TabsTrigger value="notes"><MessageSquare className="h-3.5 w-3.5 mr-1" />Notes</TabsTrigger>
            <TabsTrigger value="transcript"><FileText className="h-3.5 w-3.5 mr-1" />Transcript</TabsTrigger>
            <TabsTrigger value="analysis"><Brain className="h-3.5 w-3.5 mr-1" />AI Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="notes">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Meeting Notes</CardTitle>
                {!editingNotes && (
                  <Button size="sm" variant="outline" onClick={() => { setNotes(meeting.notes ?? ''); setEditingNotes(true); }}>Edit</Button>
                )}
              </CardHeader>
              <CardContent>
                {editingNotes ? (
                  <div className="space-y-2">
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={10} placeholder="Write meeting notes (supports markdown)..." />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveNotes} disabled={updateMeeting.isPending}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingNotes(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : meeting.notes ? (
                  <div className="prose prose-sm max-w-none text-sm">
                    <ReactMarkdown>{meeting.notes}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No notes yet. Click Edit to add meeting notes.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transcript">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Transcript</CardTitle>
                {!editingTranscript && (
                  <Button size="sm" variant="outline" onClick={() => { setTranscript(meeting.transcript ?? ''); setEditingTranscript(true); }}>Edit</Button>
                )}
              </CardHeader>
              <CardContent>
                {editingTranscript ? (
                  <div className="space-y-2">
                    <Textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={15} placeholder="Paste meeting transcript..." />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveTranscript} disabled={updateMeeting.isPending}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingTranscript(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : meeting.transcript ? (
                  <div className="prose prose-sm max-w-none text-sm whitespace-pre-wrap">{meeting.transcript}</div>
                ) : (
                  <p className="text-muted-foreground text-sm">No transcript yet. Click Edit to paste a transcript.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleAnalyse} disabled={analysing}>
                  {analysing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                  Analyse Transcript
                </Button>
                <Button size="sm" variant="outline" onClick={handleDiscoveryPrep} disabled={prepping}>
                  {prepping ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Search className="h-3.5 w-3.5 mr-1" />}
                  Discovery Prep
                </Button>
              </div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {analysis?.type === 'discovery_prep' ? 'Discovery Brief' : 'Post-Meeting Analysis'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis ? (
                    <div className="space-y-4">
                      {/* Common: summary / executive_summary */}
                      {(analysis.summary || analysis.executive_summary) && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Summary</h4>
                          <p className="text-sm">{analysis.summary || analysis.executive_summary}</p>
                        </div>
                      )}
                      {/* Post-meeting: action items */}
                      {analysis.action_items && Array.isArray(analysis.action_items) && analysis.action_items.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Action Items</h4>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {analysis.action_items.map((item: any, i: number) => (
                              <li key={i}>{typeof item === 'string' ? item : item.task}{item.assignee ? ` → ${item.assignee}` : ''}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {analysis.key_decisions && Array.isArray(analysis.key_decisions) && analysis.key_decisions.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Key Decisions</h4>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {analysis.key_decisions.map((d: string, i: number) => <li key={i}>{d}</li>)}
                          </ul>
                        </div>
                      )}
                      {/* Discovery prep: talking points */}
                      {analysis.talking_points && Array.isArray(analysis.talking_points) && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Talking Points</h4>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {analysis.talking_points.map((t: string, i: number) => <li key={i}>{t}</li>)}
                          </ul>
                        </div>
                      )}
                      {analysis.questions_to_ask && Array.isArray(analysis.questions_to_ask) && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Questions to Ask</h4>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {analysis.questions_to_ask.map((q: string, i: number) => <li key={i}>{q}</li>)}
                          </ul>
                        </div>
                      )}
                      {analysis.recommended_services && Array.isArray(analysis.recommended_services) && analysis.recommended_services.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Recommended Services</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.recommended_services.map((s: string, i: number) => <Badge key={i} variant="secondary">{s}</Badge>)}
                          </div>
                        </div>
                      )}
                      {/* Sentiment + risks */}
                      {analysis.sentiment && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Sentiment</h4>
                          <Badge variant="outline">{analysis.sentiment}</Badge>
                        </div>
                      )}
                      {analysis.risk_flags && Array.isArray(analysis.risk_flags) && analysis.risk_flags.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Risk Flags</h4>
                          <ul className="list-disc list-inside text-sm space-y-1 text-destructive">
                            {analysis.risk_flags.map((r: string, i: number) => <li key={i}>{r}</li>)}
                          </ul>
                        </div>
                      )}
                      {analysis.follow_ups && Array.isArray(analysis.follow_ups) && analysis.follow_ups.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Follow-ups</h4>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {analysis.follow_ups.map((f: string, i: number) => <li key={i}>{f}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No analysis yet. Use the buttons above to generate one.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
