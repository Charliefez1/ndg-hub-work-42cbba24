import { useState, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AIAgent = 'general' | 'project-planner' | 'content-writer' | 'data-analyst';

interface UseAIOptions {
  agent?: AIAgent;
  context?: Record<string, any>;
}

interface UseAIReturn {
  send: (prompt: string) => Promise<string>;
  cancel: () => void;
  isStreaming: boolean;
  response: string;
  error: string | null;
}

// Rate limiting: 20 calls/hour
const RATE_LIMIT = 20;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function getRateState(): { count: number; resetAt: number } {
  const stored = localStorage.getItem('ndg-ai-rate');
  if (stored) {
    const parsed = JSON.parse(stored);
    if (Date.now() > parsed.resetAt) {
      return { count: 0, resetAt: Date.now() + RATE_WINDOW };
    }
    return parsed;
  }
  return { count: 0, resetAt: Date.now() + RATE_WINDOW };
}

function incrementRate(): boolean {
  const state = getRateState();
  if (state.count >= RATE_LIMIT) return false;
  state.count++;
  localStorage.setItem('ndg-ai-rate', JSON.stringify(state));
  return true;
}

export function getRemainingCalls(): number {
  const state = getRateState();
  return Math.max(0, RATE_LIMIT - state.count);
}

export function useAI(options: UseAIOptions = {}): UseAIReturn {
  const { agent = 'general', context } = options;
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async (prompt: string): Promise<string> => {
    if (!incrementRate()) {
      const msg = 'Rate limit reached (20 calls/hour). Please wait.';
      setError(msg);
      throw new Error(msg);
    }

    setIsStreaming(true);
    setResponse('');
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Build messages with context
      const messages: Array<{ role: string; content: string }> = [];
      if (context) {
        messages.push({
          role: 'user',
          content: `[Context: ${JSON.stringify(context)}]`,
        });
      }
      messages.push({ role: 'user', content: prompt });

      const { data, error: fnError } = await supabase.functions.invoke('ai-assistant', {
        body: { messages, agent },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const content = data?.content || 'No response received.';
      setResponse(content);
      return content;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Request cancelled');
        return '';
      }
      const msg = err.message || 'AI request failed';
      setError(msg);
      throw err;
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [agent, context]);

  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  return { send, cancel, isStreaming, response, error };
}

export interface AIContextData {
  entityType: string;
  entityId?: string;
  data: Record<string, any>;
}

// Simple context hook — sets what page/entity context the AI should know about
export function useAIContext(contextData: AIContextData | null) {
  return contextData ? {
    entityType: contextData.entityType,
    entityId: contextData.entityId,
    ...contextData.data,
  } : undefined;
}

// Extract hook — calls ai-extract for Create from Plan
export function useAIExtract() {
  return useMutation({
    mutationFn: async (text: string) => {
      const { data, error } = await supabase.functions.invoke('ai-extract', {
        body: { text },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.data;
    },
  });
}
