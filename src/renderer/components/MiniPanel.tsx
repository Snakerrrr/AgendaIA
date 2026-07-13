import React, { useEffect, useState } from 'react';
import {
  ChevronDown, ChevronUp, Clock, CheckCircle2, AlertTriangle,
  ListTodo, X, Bell, ChevronRight, Repeat,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { useAppStore } from '../store/useAppStore';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import type { Task, Subtask, Reminder } from '../../shared/types';
import { format, parseISO, isPast } from 'date-fns';
import { es } from 'date-fns/locale';

interface MiniPanelProps {
  selectedTask: Task | null;
  onClearSelection: () => void;
  onEditTask: (task: Task) => void;
}

export function MiniPanel({ selectedTask, onClearSelection, onEditTask }: MiniPanelProps) {
  const { dashboardStats, tasks, loadDashboardStats } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);

  useEffect(() => {
    loadDashboardStats();
    const today = new Date().toISOString().split('T')[0];
    api.tasks.getByDate(today).then(setTodayTasks);
  }, [tasks]);

  useEffect(() => {
    if (selectedTask) {
      api.subtasks.getByTask(selectedTask.id).then(setSubtasks);
      api.reminders.getByTask(selectedTask.id).then(setReminders);
    }
  }, [selectedTask]);

  const stats = dashboardStats ?? { totalToday: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 };
  const showingTask = !!selectedTask;

  return (
    <div
      className={cn(
        'fixed bottom-3 right-3 z-40 rounded-lg border border-border bg-card/95 backdrop-blur-sm shadow-xl transition-all duration-300 glow-border',
        collapsed ? 'w-[220px]' : 'w-[300px]'
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer border-b border-border/50"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          {showingTask ? (
            <>
              <ListTodo size={13} className="text-primary" />
              <span className="text-xs font-semibold truncate max-w-[180px]">{selectedTask.title}</span>
            </>
          ) : (
            <>
              <Clock size={13} className="text-primary" />
              <span className="text-xs font-semibold">Resumen del día</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {showingTask && (
            <button
              onClick={(e) => { e.stopPropagation(); onClearSelection(); }}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </button>
          )}
          {collapsed ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="p-3 max-h-[280px] overflow-y-auto animate-fade-in">
          {showingTask ? (
            <TaskDetail
              task={selectedTask}
              subtasks={subtasks}
              reminders={reminders}
              onEdit={() => onEditTask(selectedTask)}
            />
          ) : (
            <DaySummary stats={stats} todayTasks={todayTasks} onSelectTask={onEditTask} />
          )}
        </div>
      )}
    </div>
  );
}

function DaySummary({ stats, todayTasks, onSelectTask }: {
  stats: { totalToday: number; pending: number; inProgress: number; completed: number; overdue: number };
  todayTasks: Task[];
  onSelectTask: (t: Task) => void;
}) {
  const progress = stats.totalToday > 0 ? Math.round((stats.completed / stats.totalToday) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Mini stats */}
      <div className="grid grid-cols-4 gap-2">
        <MiniStat icon={ListTodo} value={stats.totalToday} label="Hoy" color="text-blue-400" />
        <MiniStat icon={Clock} value={stats.pending} label="Pend." color="text-yellow-400" />
        <MiniStat icon={CheckCircle2} value={stats.completed} label="Hecho" color="text-green-400" />
        <MiniStat icon={AlertTriangle} value={stats.overdue} label="Venc." color="text-red-400" />
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">Progreso</span>
          <span className="text-[10px] font-bold text-primary">{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Next tasks */}
      {todayTasks.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Próximas</p>
          <div className="space-y-1">
            {todayTasks
              .filter((t) => t.status !== 'completed')
              .slice(0, 4)
              .map((t) => (
                <button
                  key={t.id}
                  onClick={() => onSelectTask(t)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-accent/50 transition-colors"
                >
                  <span className={cn(
                    'h-1.5 w-1.5 rounded-full shrink-0',
                    t.priority === 'high' ? 'bg-red-400' : t.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                  )} />
                  <span className="text-[11px] truncate flex-1">{t.title}</span>
                  {t.due_date && (
                    <span className="text-[9px] text-muted-foreground shrink-0">
                      {format(parseISO(t.due_date), 'HH:mm')}
                    </span>
                  )}
                </button>
              ))}
          </div>
        </div>
      )}

      {todayTasks.length === 0 && (
        <p className="text-[11px] text-muted-foreground text-center py-2">No hay tareas para hoy</p>
      )}
    </div>
  );
}

function TaskDetail({ task, subtasks, reminders, onEdit }: {
  task: Task; subtasks: Subtask[]; reminders: Reminder[]; onEdit: () => void;
}) {
  const completedSubs = subtasks.filter((s) => s.is_completed).length;
  const totalSubs = subtasks.length;

  return (
    <div className="space-y-3">
      {/* Status + priority */}
      <div className="flex flex-wrap gap-1.5">
        <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'} className="text-[10px]">
          {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
        </Badge>
        <Badge variant="outline" className={cn('text-[10px]',
          task.status === 'completed' ? 'text-green-400' : task.status === 'in_progress' ? 'text-blue-400' : 'text-yellow-400'
        )}>
          {task.status === 'completed' ? 'Completada' : task.status === 'in_progress' ? 'En progreso' : 'Pendiente'}
        </Badge>
        {task.is_recurring && <Badge variant="outline" className="text-[10px] text-purple-400"><Repeat size={8} className="mr-1" />Recurrente</Badge>}
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">{task.description}</p>
      )}

      {/* Due date */}
      {task.due_date && (
        <div className="flex items-center gap-1.5">
          <Clock size={11} className={isPast(parseISO(task.due_date)) && task.status !== 'completed' ? 'text-red-400' : 'text-muted-foreground'} />
          <span className="text-[11px] text-muted-foreground">
            {format(parseISO(task.due_date), "EEEE d MMM, HH:mm", { locale: es })}
          </span>
        </div>
      )}

      {/* Category */}
      {task.category_name && (
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: task.category_color ?? '#3b82f6' }} />
          <span className="text-[11px] text-muted-foreground">{task.category_name}</span>
        </div>
      )}

      {/* Subtasks */}
      {totalSubs > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Subtareas</span>
            <span className="text-[10px] text-muted-foreground">{completedSubs}/{totalSubs}</span>
          </div>
          <div className="h-1 rounded-full bg-secondary overflow-hidden mb-1.5">
            <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${(completedSubs / totalSubs) * 100}%` }} />
          </div>
          <div className="space-y-0.5">
            {subtasks.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center gap-1.5">
                <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', s.is_completed ? 'bg-green-400' : 'bg-muted-foreground/40')} />
                <span className={cn('text-[10px] truncate', s.is_completed && 'line-through text-muted-foreground')}>{s.title}</span>
              </div>
            ))}
            {totalSubs > 5 && <p className="text-[9px] text-muted-foreground">+{totalSubs - 5} más</p>}
          </div>
        </div>
      )}

      {/* Reminders */}
      {reminders.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Recordatorios</p>
          {reminders.filter((r) => !r.is_sent).slice(0, 3).map((r) => (
            <div key={r.id} className="flex items-center gap-1.5">
              <Bell size={10} className="text-primary shrink-0" />
              <span className="text-[10px] text-muted-foreground">
                {format(parseISO(r.remind_at), "d MMM, HH:mm", { locale: es })}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Edit button */}
      <button
        onClick={onEdit}
        className="flex w-full items-center justify-center gap-1.5 rounded bg-primary/10 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors"
      >
        Editar tarea <ChevronRight size={12} />
      </button>
    </div>
  );
}

function MiniStat({ icon: Icon, value, label, color }: { icon: React.ElementType; value: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <Icon size={12} className={cn(color, 'mx-auto mb-0.5')} />
      <p className="text-sm font-bold">{value}</p>
      <p className="text-[9px] text-muted-foreground">{label}</p>
    </div>
  );
}
