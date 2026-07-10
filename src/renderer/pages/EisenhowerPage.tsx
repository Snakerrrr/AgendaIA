import React, { useEffect, useState } from 'react';
import { Grid3X3, AlertTriangle, Clock, Trash2 } from 'lucide-react';
import { TaskCard } from '../components/TaskCard';
import { TaskForm } from '../components/TaskForm';
import { useAppStore } from '../store/useAppStore';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import type { Task } from '../../shared/types';

const quadrants = [
  {
    id: 'urgent-important',
    title: 'Hacer Primero',
    subtitle: 'Urgente + Importante',
    color: 'border-t-red-500',
    bg: 'bg-red-500/5',
    icon: AlertTriangle,
    iconColor: 'text-red-400',
    filter: (t: Task) => t.urgency === 'urgent' && t.priority === 'high',
  },
  {
    id: 'not-urgent-important',
    title: 'Planificar',
    subtitle: 'No urgente + Importante',
    color: 'border-t-blue-500',
    bg: 'bg-blue-500/5',
    icon: Clock,
    iconColor: 'text-blue-400',
    filter: (t: Task) => t.urgency !== 'urgent' && t.priority === 'high',
  },
  {
    id: 'urgent-not-important',
    title: 'Delegar',
    subtitle: 'Urgente + No importante',
    color: 'border-t-yellow-500',
    bg: 'bg-yellow-500/5',
    icon: AlertTriangle,
    iconColor: 'text-yellow-400',
    filter: (t: Task) => t.urgency === 'urgent' && t.priority !== 'high',
  },
  {
    id: 'not-urgent-not-important',
    title: 'Eliminar',
    subtitle: 'No urgente + No importante',
    color: 'border-t-gray-500',
    bg: 'bg-gray-500/5',
    icon: Trash2,
    iconColor: 'text-gray-400',
    filter: (t: Task) => t.urgency !== 'urgent' && t.priority !== 'high',
  },
];

export function EisenhowerPage() {
  const { tasks, loadTasks } = useAppStore();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => { loadTasks(); }, []);

  const activeTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Grid3X3 className="text-primary" size={24} />
          Matriz Eisenhower
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Organiza tus tareas por urgencia e importancia. Usa la prioridad "Alta" para marcar como importante
          y el campo "Urgencia" al crear/editar tareas.
        </p>
      </div>

      <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-3 overflow-hidden">
        {quadrants.map((q) => {
          const Icon = q.icon;
          const qTasks = activeTasks.filter(q.filter);
          return (
            <div
              key={q.id}
              className={cn(
                'flex flex-col rounded-lg border border-border border-t-4 overflow-hidden',
                q.color, q.bg
              )}
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <Icon size={16} className={q.iconColor} />
                <div>
                  <h3 className="text-sm font-semibold">{q.title}</h3>
                  <p className="text-xs text-muted-foreground">{q.subtitle}</p>
                </div>
                <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                  {qTasks.length}
                </span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {qTasks.length > 0 ? (
                  qTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onEdit={setEditingTask} />
                  ))
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    Sin tareas
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editingTask && (
        <TaskForm task={editingTask} onClose={() => setEditingTask(null)} />
      )}
    </div>
  );
}
