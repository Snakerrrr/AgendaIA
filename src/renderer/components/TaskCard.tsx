import React from 'react';
import { Check, Clock, Edit2, Trash2, AlertCircle, Repeat } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { useAppStore } from '../store/useAppStore';
import { playCompleteSound, playDeleteSound, playClickSound } from '../hooks/useSound';
import type { Task } from '../../shared/types';
import { format, isPast, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

const priorityConfig = {
  high: { label: 'Alta', variant: 'danger' as const, color: 'border-l-red-500' },
  medium: { label: 'Media', variant: 'warning' as const, color: 'border-l-yellow-500' },
  low: { label: 'Baja', variant: 'success' as const, color: 'border-l-green-500' },
};

const statusConfig = {
  pending: { label: 'Pendiente', class: 'text-yellow-400' },
  in_progress: { label: 'En progreso', class: 'text-blue-400' },
  completed: { label: 'Completada', class: 'text-green-400' },
  cancelled: { label: 'Cancelada', class: 'text-gray-400' },
};

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const { loadTasks, loadDashboardStats } = useAppStore();
  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'completed' && task.status !== 'cancelled';
  const isCompleted = task.status === 'completed';

  const handleToggleComplete = async () => {
    if (!isCompleted) playCompleteSound();
    await api.tasks.update({ id: task.id, status: isCompleted ? 'pending' : 'completed' });
    await Promise.all([loadTasks(), loadDashboardStats()]);
  };

  const handleDelete = async () => {
    playDeleteSound();
    await api.tasks.delete(task.id);
    await Promise.all([loadTasks(), loadDashboardStats()]);
  };

  const handleCycleStatus = async () => {
    const order = ['pending', 'in_progress', 'completed'] as const;
    const idx = order.indexOf(task.status as typeof order[number]);
    await api.tasks.update({ id: task.id, status: order[(idx + 1) % order.length] });
    await Promise.all([loadTasks(), loadDashboardStats()]);
  };

  return (
    <div
      className={cn(
        'group rounded border border-border bg-card p-3 transition-all duration-200 border-l-4 animate-slide-in',
        'hover:glow-border-hover glow-border',
        priority.color,
        isCompleted && 'opacity-50'
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={handleToggleComplete}
          className={cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all duration-200',
            isCompleted
              ? 'border-green-500 bg-green-500 text-white shadow-[0_0_8px_rgba(34,197,94,0.4)]'
              : 'border-muted-foreground/40 hover:border-primary hover:shadow-[0_0_8px_hsl(var(--glow-color)/0.3)]'
          )}
        >
          {isCompleted && <Check size={12} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn('font-medium text-sm', isCompleted && 'line-through text-muted-foreground')}>
              {task.title}
            </h3>
            {isOverdue && <AlertCircle size={14} className="shrink-0 text-red-400 animate-glow-pulse" />}
            {task.urgency === 'urgent' && (
              <Badge variant="danger" className="text-[10px] px-1.5 py-0">URGENTE</Badge>
            )}
          </div>

          {task.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{task.description}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant={priority.variant} className="text-[10px]">{priority.label}</Badge>

            <button onClick={handleCycleStatus} className="cursor-pointer">
              <Badge variant="outline" className={cn(status.class, 'text-[10px]')}>{status.label}</Badge>
            </button>

            {task.category_name && (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: task.category_color ?? '#3b82f6' }} />
                {task.category_name}
              </Badge>
            )}

            {task.is_recurring ? (
              <Badge variant="outline" className="text-[10px] text-purple-400">Plantilla</Badge>
            ) : task.recurring_parent_id ? (
              <Badge variant="outline" className="text-[10px] text-purple-400/60">Diaria</Badge>
            ) : null}

            {task.due_date && (
              <span className={cn('flex items-center gap-1 text-[10px]', isOverdue ? 'text-red-400' : 'text-muted-foreground')}>
                <Clock size={10} />
                {format(parseISO(task.due_date), 'dd MMM, HH:mm', { locale: es })}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {!task.is_recurring && !task.recurring_parent_id && (
            <button
              onClick={async () => {
                playClickSound();
                await api.tasks.update({ id: task.id, is_recurring: true, recurrence_type: 'daily', recurrence_interval: 1 });
                await loadTasks();
              }}
              className="rounded p-1.5 text-muted-foreground hover:bg-purple-500/10 hover:text-purple-400 transition-colors"
              title="Hacer recurrente (diaria)"
            >
              <Repeat size={14} />
            </button>
          )}
          <button onClick={() => onEdit(task)} className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <Edit2 size={14} />
          </button>
          <button onClick={handleDelete} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/20 hover:text-red-400 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
