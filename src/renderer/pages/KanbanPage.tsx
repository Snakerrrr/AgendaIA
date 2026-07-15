import React, { useEffect, useState } from 'react';
import { Columns3, Plus, GripVertical } from 'lucide-react';
import { Button } from '../components/ui/button';
import { TaskCard } from '../components/TaskCard';
import { TaskForm } from '../components/TaskForm';
import { useAppStore } from '../store/useAppStore';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import type { Task, TaskStatus } from '../../shared/types';

const columns: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'pending', label: 'Pendiente', color: 'border-t-yellow-500' },
  { id: 'in_progress', label: 'En Progreso', color: 'border-t-blue-500' },
  { id: 'completed', label: 'Completada', color: 'border-t-green-500' },
];

export function KanbanPage() {
  const { tasks, loadTasks, loadDashboardStats } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  useEffect(() => { loadTasks(); }, []);

  const handleDragStart = (taskId: number) => {
    setDraggingId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, col: TaskStatus) => {
    e.preventDefault();
    setDragOverCol(col);
  };

  const handleDrop = async (col: TaskStatus) => {
    if (draggingId !== null) {
      await api.tasks.update({ id: draggingId, status: col });
      await Promise.all([loadTasks(), loadDashboardStats()]);
    }
    setDraggingId(null);
    setDragOverCol(null);
  };

  useEffect(() => { loadTasks(); }, []);

  const activeTasks = tasks.filter((t) => t.status !== 'cancelled');

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2 glow-text">
          <Columns3 className="text-primary" size={24} />
          Kanban
        </h1>
        <Button onClick={() => setShowForm(true)} className="gap-2 glow-sm">
          <Plus size={16} /> Nueva Tarea
        </Button>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {columns.map((col) => {
          const colTasks = activeTasks.filter((t) => t.status === col.id);
          const isOver = dragOverCol === col.id;
          return (
            <div
              key={col.id}
              className={cn(
                'flex flex-1 flex-col rounded-lg border border-border border-t-4 overflow-hidden transition-all',
                col.color,
                isOver && 'bg-primary/5 border-primary/30'
              )}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={() => handleDrop(col.id)}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">{colTasks.length}</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
                    className={cn('cursor-grab active:cursor-grabbing', draggingId === task.id && 'opacity-40')}
                  >
                    <TaskCard task={task} onEdit={setEditingTask} />
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground anime-gradient">
                    Arrastra tareas aquí
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(showForm || editingTask) && (
        <TaskForm task={editingTask} onClose={() => { setShowForm(false); setEditingTask(null); }} />
      )}
    </div>
  );
}
