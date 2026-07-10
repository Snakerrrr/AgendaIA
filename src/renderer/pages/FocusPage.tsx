import React, { useEffect, useState } from 'react';
import { Target, Plus, Star, StarOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { TaskCard } from '../components/TaskCard';
import { TaskForm } from '../components/TaskForm';
import { useAppStore } from '../store/useAppStore';
import { api } from '../lib/api';
import type { Task } from '../../shared/types';

export function FocusPage() {
  const { tasks, loadTasks } = useAppStore();
  const [focusTasks, setFocusTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const loadFocus = async () => {
    const ft = await api.tasks.getFocusTasks();
    setFocusTasks(ft);
  };

  useEffect(() => { loadFocus(); loadTasks(); }, []);

  const nonFocusPending = tasks.filter(
    (t) => !t.is_focus && t.status !== 'completed' && t.status !== 'cancelled'
  );

  const handleAddToFocus = async (taskId: number) => {
    try {
      await api.tasks.setFocus(taskId, true);
      await loadFocus();
      await loadTasks();
    } catch { /* max 3 */ }
  };

  const handleRemoveFromFocus = async (taskId: number) => {
    await api.tasks.setFocus(taskId, false);
    await loadFocus();
    await loadTasks();
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="text-primary" size={24} />
          Foco del Día
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selecciona hasta 3 tareas para enfocarte hoy. Menos es más.
        </p>
      </div>

      {/* Focus slots */}
      <div className="mb-8 space-y-3">
        {[0, 1, 2].map((slot) => {
          const task = focusTasks[slot];
          if (task) {
            return (
              <div key={task.id} className="relative">
                <div className="absolute -left-8 top-4 flex items-center">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {slot + 1}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <TaskCard task={task} onEdit={setEditingTask} />
                  </div>
                  <button
                    onClick={() => handleRemoveFromFocus(task.id)}
                    className="mt-4 rounded p-1.5 text-yellow-400 hover:bg-yellow-500/10"
                    title="Quitar del foco"
                  >
                    <StarOff size={18} />
                  </button>
                </div>
              </div>
            );
          }
          return (
            <div
              key={`empty-${slot}`}
              className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground"
            >
              <span className="text-sm">Prioridad #{slot + 1} — Elige una tarea abajo</span>
            </div>
          );
        })}
      </div>

      {/* Available tasks */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          Tareas disponibles ({nonFocusPending.length})
        </h2>
        <div className="space-y-2">
          {nonFocusPending.length > 0 ? (
            nonFocusPending.map((task) => (
              <div key={task.id} className="flex items-start gap-2">
                <div className="flex-1">
                  <TaskCard task={task} onEdit={setEditingTask} />
                </div>
                {focusTasks.length < 3 && (
                  <button
                    onClick={() => handleAddToFocus(task.id)}
                    className="mt-4 rounded p-1.5 text-muted-foreground hover:bg-yellow-500/10 hover:text-yellow-400"
                    title="Agregar al foco"
                  >
                    <Star size={18} />
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No hay tareas pendientes
            </div>
          )}
        </div>
      </div>

      {(showForm || editingTask) && (
        <TaskForm
          task={editingTask}
          onClose={() => { setShowForm(false); setEditingTask(null); loadFocus(); }}
        />
      )}
    </div>
  );
}
