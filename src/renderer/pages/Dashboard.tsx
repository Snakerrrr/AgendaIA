import React, { useEffect, useState } from 'react';
import {
  CheckCircle2, Clock, AlertTriangle, ListTodo,
  Plus, TrendingUp, Bell,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { TaskCard } from '../components/TaskCard';
import { TaskForm } from '../components/TaskForm';
import { useAppStore } from '../store/useAppStore';
import { api } from '../lib/api';
import type { Task, Reminder } from '../../shared/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function Dashboard() {
  const { dashboardStats, tasks, reminders, loadAll } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    api.tasks.getByDate(today).then(setTodayTasks);
    api.reminders.getUpcoming(60).then(setUpcomingReminders);
  }, [tasks, reminders]);

  const stats = dashboardStats ?? { totalToday: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 };
  const progressPercent = stats.totalToday > 0 ? Math.round((stats.completed / stats.totalToday) * 100) : 0;
  const recentTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled').slice(0, 5);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold glow-text">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2 glow-sm">
          <Plus size={16} />
          Nueva Tarea
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <StatCard icon={ListTodo} label="Hoy" value={stats.totalToday} color="text-blue-400" bg="bg-blue-500/10" glow="shadow-[0_0_15px_rgba(59,130,246,0.1)]" />
        <StatCard icon={Clock} label="Pendientes" value={stats.pending + stats.inProgress} color="text-yellow-400" bg="bg-yellow-500/10" glow="shadow-[0_0_15px_rgba(245,158,11,0.1)]" />
        <StatCard icon={CheckCircle2} label="Completadas" value={stats.completed} color="text-green-400" bg="bg-green-500/10" glow="shadow-[0_0_15px_rgba(34,197,94,0.1)]" />
        <StatCard icon={AlertTriangle} label="Vencidas" value={stats.overdue} color="text-red-400" bg="bg-red-500/10" glow="shadow-[0_0_15px_rgba(239,68,68,0.1)]" />
      </div>

      {/* Progress */}
      <div className="mb-6 rounded-lg border border-border bg-card p-4 glow-border corner-accent">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp size={16} className="text-primary" />
            Progreso del día
          </span>
          <span className="text-sm font-bold text-primary glow-text">{progressPercent}%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{
              width: `${progressPercent}%`,
              boxShadow: `0 0 10px hsl(var(--glow-color) / 0.5)`,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <ListTodo size={16} /> Tareas Pendientes
          </h2>
          <div className="space-y-2">
            {recentTasks.length > 0 ? (
              recentTasks.map((task) => <TaskCard key={task.id} task={task} onEdit={setEditingTask} />)
            ) : (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground anime-gradient">
                No hay tareas pendientes
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Bell size={16} /> Próximos Recordatorios
          </h2>
          <div className="space-y-2">
            {upcomingReminders.length > 0 ? (
              upcomingReminders.map((r) => (
                <div key={r.id} className="rounded-lg border border-border bg-card p-3 glow-border animate-slide-in">
                  <p className="text-sm font-medium">{r.task_title}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={12} />
                    {format(new Date(r.remind_at), 'dd MMM, HH:mm', { locale: es })}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground anime-gradient">
                No hay recordatorios próximos
              </div>
            )}

            {todayTasks.length > 0 && (
              <>
                <h3 className="mt-4 flex items-center gap-2 text-sm font-semibold">
                  <Clock size={16} /> Tareas de Hoy
                </h3>
                {todayTasks.map((task) => <TaskCard key={task.id} task={task} onEdit={setEditingTask} />)}
              </>
            )}
          </div>
        </div>
      </div>

      {(showForm || editingTask) && (
        <TaskForm task={editingTask} onClose={() => { setShowForm(false); setEditingTask(null); }} />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg, glow }: {
  icon: React.ElementType; label: string; value: number; color: string; bg: string; glow: string;
}) {
  return (
    <div className={`rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:scale-[1.02] ${glow} corner-accent`}>
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${bg}`}>
          <Icon size={20} className={color} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
