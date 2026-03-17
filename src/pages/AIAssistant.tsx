import { useState, useRef, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

type Message = { role: 'user' | 'assistant'; content: string };
type Agent = 'general' | 'project-planner' | 'content-writer' | 'data-analyst';

const AGENTS: { value: Agent; label: string; description: string }[] = [
  { value: 'general', label: 'General Assistant', description: 'Ask anything about your projects and data' },
  { value: 'project-planner', label: 'Project Planner', description: 'Help plan and scope new projects' },
  { value: 'content-writer', label: 'Content Writer', description: 'Draft workshop content and materials' },
  { value: 'data-analyst', label: 'Data Analyst', description: 'Analyse feedback and business metrics' },
];

export default function AIAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [agent, setAgent] = useState<Agent>('general');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { messages: newMessages, agent, userId: user?.id },
      });
      if (error) throw error;
      setMessages([...newMessages, { role: 'assistant', content: data.content }]);
    } catch (err: any) {
      toast.error(err.message || 'AI request failed');
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-theme(spacing.12)-theme(spacing.lg)*2)]">
        <div className="flex items-center justify-between mb-md">
          <h1 className="text-page-title">AI Assistant</h1>
          <Select value={agent} onValueChange={(v) => setAgent(v as Agent)}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              {AGENTS.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  <div><span className="font-medium">{a.label}</span></div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-md pr-2">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-md max-w-md">
                <Bot className="h-16 w-16 mx-auto text-text-3" strokeWidth={1.25} />
                <h2 className="text-section-title">How can I help?</h2>
                <p className="text-body text-text-2">
                  {AGENTS.find((a) => a.value === agent)?.description}
                </p>
                <div className="flex flex-wrap gap-xs justify-center">
                  {['Summarise my active projects', 'Draft a workshop agenda', 'Analyse recent feedback scores'].map((q) => (
                    <button key={q} onClick={() => { setInput(q); }} className="text-caption bg-surface border rounded-full px-3 py-1.5 hover:border-primary transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex gap-sm ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1"><Bot className="h-4 w-4 text-primary" /></div>}
                <Card className={`max-w-[75%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-surface'}`}>
                  <CardContent className="p-sm">
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-body">{msg.content}</p>
                    )}
                  </CardContent>
                </Card>
                {msg.role === 'user' && <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1"><User className="h-4 w-4 text-text-2" /></div>}
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-sm">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-primary" /></div>
              <Card className="bg-surface"><CardContent className="p-sm"><Loader2 className="h-4 w-4 animate-spin text-text-3" /></CardContent></Card>
            </div>
          )}
        </div>

        <div className="mt-md flex gap-sm">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type your message..."
            className="flex-1"
            disabled={loading}
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
