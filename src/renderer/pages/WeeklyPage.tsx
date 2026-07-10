import React, { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { TaskCard } from '../components/TaskCard';
import { TaskForm } from '../components/TaskForm';
import { useAppStore } from '../store/useAppStore';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import type { Task } from '../../shared/types';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 to 21:00

export function WeeklyPage() {
  const { tasks, loadTasks } = useAppStore();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => { loadTasks(); }, []);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getTasksForDayHour = (day: Date, hour: number) => {
    return tasks.filter((t) => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      return isSameDay(d, day) && d.getHours() === hour;
    });
  };

  const getUnscheduledForDay = (day: Date) => {
    return tasks.filter((t) => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      return isSameDay(d, day) && (d.getHours() < 7 || d.getHours() > 21);
    });
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
                <th
                  key={day.toISOString()}
                  className={cn(
                    'border-b border-r border-border p-2 text-center',
                    isToday(day) && 'bg-primary/5'
                  )}
                >
                  <p className="text-[10px] uppercase text-muted-foreground">
                    {format(day, 'EEE', { locale: es })}
                  </p>
                  <p className={cn(
                    'text-sm font-bold',
                    isToday(day) && 'text-primary'
                  )}>
                    {format(day, 'd')}
                  </p>
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
                  const cellTasks = getTasksForDayHour(day, hour);
                  return (
                    <td
                      key={day.toISOString() + hour}
                      className={cn(
                        'border-b border-r border-border p-1 align-top min-h-[48px] cursor-pointer transition-colors hover:bg-accent/30',
                        isToday(day) && 'bg-primary/[0.02]'
                      )}
                      onClick={() => handleCellClick(day, hour)}
                    >
                      {cellTasks.map((t) => (
                        <div
                          key={t.id}
                          onClick={(e) => { e.stopPropagation(); setEditingTask(t); }}
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[10px] font-medium mb-0.5 truncate cursor-pointer transition-colors',
                            t.status === 'completed'
                              ? 'bg-green-500/10 text-green-400 line-through'
                              : t.priority === 'high'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-primary/10 text-primary'
                          )}
                          title={t.title}
                        >
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
