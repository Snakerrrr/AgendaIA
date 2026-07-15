import React, { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Repeat } from 'lucide-react';
import { Button } from '../components/ui/button';
import { TaskForm } from '../components/TaskForm';
import { useAppStore } from '../store/useAppStore';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import type { Task, Habit } from '../../shared/types';
import { format, addDays, startOfWeek, isSameDay, isToday, differenceInCalendarDays } from 'date-fns';
import { es } from 'date-fns/locale';

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7);

function isHabitOnDay(habit: Habit, day: Date): boolean {
  const base = new Date(habit.created_at);
  const diff = differenceInCalendarDays(day, new Date(base.getFullYear(), base.getMonth(), base.getDate()));
  if (diff < 0) return false;
  const iv = habit.recurrence_interval ?? 1;
  switch (habit.recurrence_type) {
    case 'daily': return iv === 1 || diff % iv === 0;
    case 'weekly': return day.getDay() === base.getDay();
    case 'monthly': return day.getDate() === base.getDate();
    default: return false;
  }
}

export function WeeklyPage() {
  const { tasks, habits, loadTasks, loadHabits } = useAppStore();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => { loadTasks(); loadHabits(); }, []);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const activeHabits = habits.filter((h) => h.is_active);

  const getItemsForDayHour = (day: Date, hour: number): { title: string; isHabit: boolean; task?: Task }[] => {
    const result: { title: string; isHabit: boolean; task?: Task }[] = [];
    const dateStr = format(day, 'yyyy-MM-dd');

    for (const t of tasks) {
      if (!t.due_date || t.status === 'cancelled') continue;
      const d = new Date(t.due_date);
      if (isSameDay(d, day) && d.getHours() === hour) {
        result.push({ title: t.title, isHabit: !!t.habit_id, task: t });
      }
    }

    for (const h of activeHabits) {
      if (h.scheduled_hour !== hour) continue;
      if (!isHabitOnDay(h, day)) continue;
      const alreadyHasInstance = tasks.some((t) => t.habit_id === h.id && t.due_date?.startsWith(dateStr));
      if (!alreadyHasInstance) {
        result.push({ title: h.title, isHabit: true });
      }
    }

    return result;
  };

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2 glow-text">
          <CalendarDays className="text-primary" size={24} /> Semana
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft size={16} /></Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Hoy</Button>
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight size={16} /></Button>
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
                  const items = getItemsForDayHour(day, hour);
                  return (
                    <td key={day.toISOString() + hour}
                      className={cn('border-b border-r border-border p-1 align-top min-h-[48px] cursor-pointer transition-colors hover:bg-accent/30', isToday(day) && 'bg-primary/[0.02]')}
                      onClick={() => { setSelectedDate(format(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour), "yyyy-MM-dd'T'HH:mm")); setShowForm(true); }}>
                      {items.map((item, i) => (
                        <div key={i}
                          onClick={(e) => { e.stopPropagation(); if (item.task) setEditingTask(item.task); }}
                          className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium mb-0.5 truncate cursor-pointer transition-colors flex items-center gap-1',
                            !item.task ? 'bg-purple-500/10 text-purple-400 border border-dashed border-purple-500/30'
                              : item.task.status === 'completed' ? 'bg-green-500/10 text-green-400 line-through'
                              : item.task.priority === 'high' ? 'bg-red-500/10 text-red-400'
                              : 'bg-primary/10 text-primary'
                          )} title={item.isHabit && !item.task ? `${item.title} (hábito)` : item.title}>
                          {item.isHabit && <Repeat size={8} className="shrink-0" />}
                          {item.title}
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
        <TaskForm task={editingTask} initialDate={!editingTask ? selectedDate : undefined}
          onClose={() => { setShowForm(false); setEditingTask(null); setSelectedDate(''); }} />
      )}
    </div>
  );
}
