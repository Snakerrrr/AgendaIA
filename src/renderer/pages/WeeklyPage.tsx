import React, { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Repeat } from 'lucide-react';
import { Button } from '../components/ui/button';
import { TaskForm } from '../components/TaskForm';
import { useAppStore } from '../store/useAppStore';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import type { Task } from '../../shared/types';
import { format, addDays, startOfWeek, isSameDay, isToday, differenceInCalendarDays } from 'date-fns';
import { es } from 'date-fns/locale';

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7);

function isRecurringOnDay(task: Task, day: Date): boolean {
  if (!task.is_recurring || !task.recurrence_type) return false;
  const baseDate = task.due_date ? new Date(task.due_date) : new Date(task.created_at);
  const baseDateOnly = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const dayOnly = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const daysDiff = differenceInCalendarDays(dayOnly, baseDateOnly);
  if (daysDiff < 0) return false;
  if (task.recurrence_end_date && dayOnly > new Date(task.recurrence_end_date)) return false;

  const interval = task.recurrence_interval ?? 1;
  switch (task.recurrence_type) {
    case 'daily': return interval === 1 || daysDiff % interval === 0;
    case 'weekly': return dayOnly.getDay() === baseDateOnly.getDay();
    case 'monthly': return dayOnly.getDate() === baseDateOnly.getDate();
    default: return false;
  }
}

export function WeeklyPage() {
  const { tasks, loadTasks } = useAppStore();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [recurringTemplates, setRecurringTemplates] = useState<Task[]>([]);

  useEffect(() => {
    loadTasks();
    api.tasks.getRecurringTemplates().then(setRecurringTemplates);
  }, []);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getTasksForDayHour = (day: Date, hour: number): { task: Task; isProjected: boolean }[] => {
    const result: { task: Task; isProjected: boolean }[] = [];

    // Real tasks
    for (const t of tasks) {
      if (!t.due_date) continue;
      const d = new Date(t.due_date);
      if (isSameDay(d, day) && d.getHours() === hour) {
        result.push({ task: t, isProjected: false });
      }
    }

    // Projected recurring templates
    for (const tmpl of recurringTemplates) {
      if (!isRecurringOnDay(tmpl, day)) continue;
      const baseDate = tmpl.due_date ? new Date(tmpl.due_date) : new Date(tmpl.created_at);
      const tmplHour = baseDate.getHours() || 9;
      if (tmplHour !== hour) continue;

      // Skip if a real instance already exists for this day
      const dateStr = format(day, 'yyyy-MM-dd');
      const alreadyExists = result.some((r) =>
        r.task.recurring_parent_id === tmpl.id ||
        (r.task.title === tmpl.title && r.task.due_date?.startsWith(dateStr))
      );
      // Also check in general tasks list
      const existsInTasks = tasks.some((t) =>
        (t.recurring_parent_id === tmpl.id || t.title === tmpl.title) &&
        t.due_date?.startsWith(dateStr) && t.id !== tmpl.id
      );

      if (!alreadyExists && !existsInTasks) {
        result.push({ task: tmpl, isProjected: true });
      }
    }

    return result;
  };

  const handleCellClick = (day: Date, hour: number) => {
    setSelectedDate(format(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0), "yyyy-MM-dd'T'HH:mm"));
    setShowForm(true);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2 glow-text">
          <CalendarDays className="text-primary" size={24} />
          Semana
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            Hoy
          </Button>
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto border border-border rounded-lg">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-card">
            <tr>
              <th className="w-16 border-b border-r border-border p-2 text-[10px] text-muted-foreground">Hora</th>
              {weekDays.map((day) => (
                <th key={day.toISOString()} className={cn('border-b border-r border-border p-2 text-center', isToday(day) && 'bg-primary/5')}>
                  <p className="text-[10px] uppercase text-muted-foreground">{format(day, 'EEE', { locale: es })}</p>
                  <p className={cn('text-sm font-bold', isToday(day) && 'text-primary')}>{format(day, 'd')}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour}>
                <td className="border-b border-r border-border p-1 text-center text-[10px] text-muted-foreground align-top">
                  {String(hour).padStart(2, '0')}:00
                </td>
                {weekDays.map((day) => {
                  const cellItems = getTasksForDayHour(day, hour);
                  return (
                    <td
                      key={day.toISOString() + hour}
                      className={cn(
                        'border-b border-r border-border p-1 align-top min-h-[48px] cursor-pointer transition-colors hover:bg-accent/30',
                        isToday(day) && 'bg-primary/[0.02]'
                      )}
                      onClick={() => handleCellClick(day, hour)}
                    >
                      {cellItems.map(({ task: t, isProjected }, idx) => (
                        <div
                          key={`${t.id}-${idx}`}
                          onClick={(e) => { e.stopPropagation(); if (!isProjected) setEditingTask(t); }}
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[10px] font-medium mb-0.5 truncate cursor-pointer transition-colors flex items-center gap-1',
                            isProjected
                              ? 'bg-purple-500/10 text-purple-400 border border-dashed border-purple-500/30'
                              : t.status === 'completed'
                              ? 'bg-green-500/10 text-green-400 line-through'
                              : t.priority === 'high'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-primary/10 text-primary'
                          )}
                          title={isProjected ? `${t.title} (recurrente)` : t.title}
                        >
                          {isProjected && <Repeat size={8} className="shrink-0" />}
                          {t.title}
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(showForm || editingTask) && (
        <TaskForm
          task={editingTask}
          initialDate={!editingTask ? selectedDate : undefined}
          onClose={() => { setShowForm(false); setEditingTask(null); setSelectedDate(''); }}
        />
      )}
    </div>
  );
}
