import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCreateFocusSession, useCompleteFocusSession } from '@/hooks/useFocusSessions';
import { useUpdateTask } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { X, Play, Pause, RotateCcw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FocusModeProps {
  task: any;
  onClose: () => void;
}

const WORK_MINUTES = 25;
const BREAK_MINUTES = 5;

export function FocusMode({ task, onClose }: FocusModeProps) {
  const { user } = useAuth();
  const createSession = useCreateFocusSession();
  const completeSession = useCompleteFocusSession();
  const updateTask = useUpdateTask();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isBreak, setIsBreak] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(WORK_MINUTES * 60);
  const [secondsLeft, setSecondsLeft] = useState(WORK_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const startSession = useCallback(async () => {
    if (!user) return;
    try {
      const s = await createSession.mutateAsync({
        user_id: user.id,
        task_id: task.id,
        duration_minutes: WORK_MINUTES,
      });
      setSessionId(s.id);
      setRunning(true);
    } catch (err: any) { toast.error(err.message); }
  }, [user, task.id, createSession]);

  useEffect(() => {
    if (!running) return;
    if (secondsLeft <= 0) {
      if (!isBreak && sessionId) {
        completeSession.mutateAsync(sessionId);
        setSessionsCompleted(p => p + 1);
        toast.success('Focus session complete! Take a break 🎉');
        setIsBreak(true);
        setTotalSeconds(BREAK_MINUTES * 60);
        setSecondsLeft(BREAK_MINUTES * 60);
      } else {
        toast('Break over! Ready for another session?');
        setIsBreak(false);
        setTotalSeconds(WORK_MINUTES * 60);
        setSecondsLeft(WORK_MINUTES * 60);
        setRunning(false);
        setSessionId(null);
      }
      return;
    }
    const timer = setInterval(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearInterval(timer);
  }, [running, secondsLeft, isBreak, sessionId, completeSession]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  const handleMarkDone = async () => {
    try {
      await updateTask.mutateAsync({ id: task.id, status: 'done', completed_at: new Date().toISOString() });
      toast.success('Task marked as done!');
      onClose();
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center">
      <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={onClose}>
        <X className="h-5 w-5" />
      </Button>

      <div className="text-center space-y-lg max-w-md w-full px-md">
        <div>
          <p className="text-caption text-text-3 uppercase tracking-wide mb-1">
            {isBreak ? 'Break Time' : 'Focus Mode'}
          </p>
          <h2 className="text-page-title">{task.title}</h2>
          {task.projects?.name && <p className="text-body text-text-3 mt-1">{task.projects.name}</p>}
        </div>

        {/* Timer display */}
        <div className="relative">
          <div className="text-7xl font-bold font-mono tabular-nums tracking-tight text-foreground">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <Progress value={progress} className="mt-md h-2" />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-md">
          {!running && !sessionId ? (
            <Button size="lg" onClick={startSession} className="gap-2">
              <Play className="h-5 w-5" /> Start Focus
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => setRunning(!running)}
              >
                {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => {
                  setSecondsLeft(isBreak ? BREAK_MINUTES * 60 : WORK_MINUTES * 60);
                  setTotalSeconds(isBreak ? BREAK_MINUTES * 60 : WORK_MINUTES * 60);
                }}
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-lg text-center">
          <div>
            <p className="text-2xl font-bold">{sessionsCompleted}</p>
            <p className="text-caption text-text-3">Sessions</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{sessionsCompleted * WORK_MINUTES}m</p>
            <p className="text-caption text-text-3">Focused</p>
          </div>
        </div>

        {/* Mark done */}
        <Button variant="outline" onClick={handleMarkDone} className="gap-2">
          <CheckCircle className="h-4 w-4" /> Mark Task Done
        </Button>
      </div>
    </div>
  );
}
