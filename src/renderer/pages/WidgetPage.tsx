import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Timer, Bell, ExternalLink, Check } from 'lucide-react';
import { api } from '../lib/api';
import { playCompleteSound } from '../hooks/useSound';
import { cn } from '../lib/utils';
import type { Task, Reminder, DashboardStats } from '../../shared/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function WidgetPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  const loadData = async () => {
    const [s, r, p] = await Promise.all([
      api.tasks.getDashboardStats(),
      api.reminders.getUpcoming(60),
      api.pomodoro.getToday(),
    ]);
    setStats(s);
    setReminders(r);
    setPomodoroCount(p.length);

    const today = new Date().toISOString().split('T')[0];
    const tasks = await api.tasks.getByDate(today);
    const pending = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
    setTodayTasks(pending.slice(0, 6));
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleComplete = async (id: number) => {
    playCompleteSound();
    await api.tasks.update({ id, status: 'completed' });
    await loadData();
  };

  const openMain = () => { api.app.getAutoStart().then(() => {}); (window as any).api?.app && (window as any).electronOpenMain?.(); };

  const progress = stats && stats.totalToday > 0
    ? Math.round((stats.completed / stats.totalToday) * 100)
    : 0;

  return (
    <div className="h-screen bg-background text-foreground overflow-hidden flex flex-col" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-primary flex items-center justify-center">
            <span className="text-[9px] font-bold text-primary-foreground">A</span>
          </div>
          <span className="text-xs font-bold tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            AGENDA<span className="text-primary">IA</span>
          </span>
        </div>
        <button
          onClick={() => { (window as any).api?.app && window.api.app.getAutoStart(); ipcOpenMain(); }}
          className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          Abrir app <ExternalLink size={10} />
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 px-3 py-2">
        <MiniStat icon={CheckCircle2} label="Hoy" value={stats?.totalToday ?? 0} color="text-blue-400" />
        <MiniStat icon={Clock} label="Pendientes" value={(stats?.pending ?? 0) + (stats?.inProgress ?? 0)} color="text-yellow-400" />
        <MiniStat icon={Timer} label="Pomodoros" value={pomodoroCount} color="text-red-400" />
      </div>

      {/* Progress */}
      <div className="px-3 pb-2">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
          <span>Progreso</span>
          <span className="text-primary font-bold">{progress}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 overflow-y-auto px-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">
          Tareas de hoy
        </p>
        {todayTasks.length > 0 ? (
          <div className="space-y-1">
            {todayTasks.map((t) => (
              <div key={t.id} className="flex items-center gap-2 rounded px-2 py-1.5 bg-card border border-border hover:border-primary/30 transition-all group">
                <button
                  onClick={() => handleComplete(t.id)}
                  className="shrink-0 h-4 w-4 rounded border-2 border-muted-foreground/40 hover:border-primary flex items-center justify-center transition-colors"
                >
                  <Check size={10} className="opacity-0 group-hover:opacity-50" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{t.title}</p>
                  {t.due_date && (
                    <p className="text-[10px] text-muted-foreground">
                      {format(parseISO(t.due_date), 'HH:mm')}
                    </p>
                  )}
                </div>
                <span className={cn('h-2 w-2 rounded-full shrink-0',
                  t.priority === 'high' ? 'bg-red-400' : t.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                )} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">Sin tareas pendientes hoy</p>
        )}

        {/* Reminders */}
        {reminders.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">
              Recordatorios
            </p>
            {reminders.slice(0, 3).map((r) => (
              <div key={r.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-xs">
                <Bell size={10} className="text-primary shrink-0" />
                <span className="flex-1 truncate">{r.task_title}</span>
                <span className="text-[10px] text-muted-foreground">
                  {format(parseISO(r.remind_at), 'HH:mm')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-border text-center">
        <p className="text-[9px] text-muted-foreground/50">
          {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
        </p>
      </div>
    </div>
  );
}

function ipcOpenMain() {
  try { (window as any).api?.app && window.api.app.getAutoStart(); } catch {}
  try { (window as any).electronAPI?.openMain?.(); } catch {}
  window.api?.app && (window as any).__openMain?.();
}

function MiniStat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="rounded border border-border bg-card p-2 text-center">
      <Icon size={14} className={cn(color, 'mx-auto mb-0.5')} />
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="text-[9px] text-muted-foreground">{label}</p>
    </div>
  );
}
