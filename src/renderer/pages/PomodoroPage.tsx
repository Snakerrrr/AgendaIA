import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { useAppStore } from '../store/useAppStore';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import type { Task, PomodoroSession } from '../../shared/types';

type TimerMode = 'focus' | 'short_break' | 'long_break';

const DURATIONS: Record<TimerMode, number> = {
  focus: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};

const MODE_LABELS: Record<TimerMode, string> = {
  focus: 'Enfoque',
  short_break: 'Descanso Corto',
  long_break: 'Descanso Largo',
};

export function PomodoroPage() {
  const { tasks, loadTasks } = useAppStore();
  const [mode, setMode] = useState<TimerMode>('focus');
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [todaySessions, setTodaySessions] = useState<PomodoroSession[]>([]);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { loadTasks(); loadTodaySessions(); }, []);

  const loadTodaySessions = async () => {
    const sessions = await api.pomodoro.getToday();
    setTodaySessions(sessions);
    setPomodoroCount(sessions.length);
  };

  const tick = useCallback(() => {
    setSecondsLeft((prev) => {
      if (prev <= 1) {
        handleTimerComplete();
        return 0;
      }
      return prev - 1;
    });
  }, [mode, selectedTaskId]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, tick]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    const durationMinutes = DURATIONS[mode] / 60;
    await api.pomodoro.save({
      task_id: selectedTaskId ? parseInt(selectedTaskId) : null,
      duration_minutes: durationMinutes,
      type: mode,
    });

    await loadTodaySessions();

    new Notification('AgendaIA - Pomodoro', {
      body: mode === 'focus'
        ? '¡Tiempo de enfoque terminado! Toma un descanso.'
        : '¡Descanso terminado! Vuelve al enfoque.',
    });

    if (mode === 'focus') {
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);
      const nextMode = newCount % 4 === 0 ? 'long_break' : 'short_break';
      switchMode(nextMode);
    } else {
      switchMode('focus');
    }
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setSecondsLeft(DURATIONS[newMode]);
    setIsRunning(false);
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(DURATIONS[mode]);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = 1 - secondsLeft / DURATIONS[mode];
  const circumference = 2 * Math.PI * 120;

  const pendingTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
  const taskOptions = [
    { value: '', label: 'Sin tarea asociada' },
    ...pendingTasks.map((t) => ({ value: t.id.toString(), label: t.title })),
  ];

  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      {/* Mode tabs */}
      <div className="mb-8 flex gap-2">
        {(['focus', 'short_break', 'long_break'] as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => { if (!isRunning) switchMode(m); }}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              mode === m
                ? m === 'focus' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                : 'text-muted-foreground hover:bg-accent'
            )}
          >
            {m === 'focus' ? <Brain size={14} className="inline mr-1" /> : <Coffee size={14} className="inline mr-1" />}
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Circular timer */}
      <div className="relative mb-8">
        <svg width="280" height="280" className="-rotate-90">
          <circle cx="140" cy="140" r="120" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
          <circle
            cx="140" cy="140" r="120" fill="none"
            stroke={mode === 'focus' ? '#ef4444' : '#22c55e'}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <span className="mt-1 text-sm text-muted-foreground">{MODE_LABELS[mode]}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 flex items-center gap-3">
        <Button
          size="lg"
          onClick={toggleTimer}
          className={cn('gap-2 rounded-full px-8', mode === 'focus' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600')}
        >
          {isRunning ? <Pause size={20} /> : <Play size={20} />}
          {isRunning ? 'Pausar' : 'Iniciar'}
        </Button>
        <Button size="icon" variant="outline" onClick={resetTimer} className="rounded-full">
          <RotateCcw size={18} />
        </Button>
      </div>

      {/* Task selector */}
      <div className="mb-8 w-72">
        <Select
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          options={taskOptions}
        />
      </div>

      {/* Today's sessions */}
      <div className="w-full max-w-md">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2 size={16} />
          Pomodoros hoy: {todaySessions.length}
        </h3>
        <div className="flex flex-wrap gap-2">
          {todaySessions.map((s, i) => (
            <Badge key={s.id} variant="secondary" className="gap-1">
              #{i + 1} {s.task_title && `— ${s.task_title.slice(0, 20)}`}
            </Badge>
          ))}
          {todaySessions.length === 0 && (
            <p className="text-sm text-muted-foreground">Completa tu primer pomodoro del día</p>
          )}
        </div>
      </div>
    </div>
  );
}
