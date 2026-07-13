import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Repeat } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { TaskForm } from '../components/TaskForm';
import { TaskCard } from '../components/TaskCard';
import { useAppStore } from '../store/useAppStore';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import type { Task } from '../../shared/types';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isSameDay, isToday, addMonths, subMonths,
  startOfWeek, endOfWeek, differenceInCalendarDays,
} from 'date-fns';
import { es } from 'date-fns/locale';

function isRecurringOnDay(task: Task, day: Date): boolean {
  if (!task.is_recurring || !task.recurrence_type) return false;

  const baseDate = task.due_date ? new Date(task.due_date) : new Date(task.created_at);
  const baseDateOnly = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const dayOnly = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const daysDiff = differenceInCalendarDays(dayOnly, baseDateOnly);

  if (daysDiff < 0) return false;
  if (task.recurrence_end_date) {
    const endDate = new Date(task.recurrence_end_date);
    if (dayOnly > endDate) return false;
  }

  const interval = task.recurrence_interval ?? 1;
  switch (task.recurrence_type) {
    case 'daily':
      return interval === 1 || daysDiff % interval === 0;
    case 'weekly':
      return dayOnly.getDay() === baseDateOnly.getDay() && (interval === 1 || Math.floor(daysDiff / 7) % interval === 0);
    case 'monthly':
      return dayOnly.getDate() === baseDateOnly.getDate();
    default:
      return false;
  }
}

export function CalendarPage() {
  const { tasks, loadTasks } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedDateTasks, setSelectedDateTasks] = useState<Task[]>([]);
  const [recurringTemplates, setRecurringTemplates] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    loadTasks();
    api.tasks.getRecurringTemplates().then(setRecurringTemplates);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      api.tasks.getByDate(dateStr).then((real) => {
        // Add recurring templates that match this day but don't have a real instance
        const recurringForDay = recurringTemplates.filter((t) => {
          if (!isRecurringOnDay(t, selectedDate)) return false;
          return !real.some((r) => r.recurring_parent_id === t.id || (r.title === t.title && r.recurring_parent_id));
        });
        setSelectedDateTasks([...real, ...recurringForDay]);
      });
    }
  }, [selectedDate, tasks, recurringTemplates]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getCountForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const realCount = tasks.filter((t) => t.due_date?.startsWith(dateStr)).length;
    const recurringCount = recurringTemplates.filter((t) => {
      if (!isRecurringOnDay(t, day)) return false;
      return !tasks.some((r) => r.recurring_parent_id === t.id && r.due_date?.startsWith(dateStr));
    }).length;
    return { real: realCount, recurring: recurringCount, total: realCount + recurringCount };
  };

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold glow-text">Calendario</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft size={16} />
            </Button>
            <span className="min-w-[160px] text-center text-sm font-semibold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </span>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight size={16} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }}>
              Hoy
            </Button>
          </div>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1">
          {dayNames.map((day) => (
            <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const { real, recurring, total } = getCountForDay(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  'relative flex h-20 flex-col items-center rounded-lg border p-1.5 text-sm transition-colors',
                  isCurrentMonth ? 'border-border' : 'border-transparent opacity-40',
                  isSelected && 'border-primary bg-primary/5',
                  !isSelected && isCurrentMonth && 'hover:border-primary/30 hover:bg-accent/50',
                  today && !isSelected && 'border-primary/50'
                )}
              >
                <span className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium',
                  today && 'bg-primary text-primary-foreground',
                  isSelected && !today && 'font-bold text-primary'
                )}>
                  {format(day, 'd')}
                </span>
                {total > 0 && (
                  <div className="mt-auto flex gap-0.5 items-center">
                    {real > 0 && (
                      <span className="flex gap-0.5">
                        {Array.from({ length: Math.min(real, 3) }).map((_, i) => (
                          <span key={i} className="h-1.5 w-1.5 rounded-full bg-primary" />
                        ))}
                      </span>
                    )}
                    {recurring > 0 && (
                      <Repeat size={10} className="text-purple-400" />
                    )}
                    {total > 3 && (
                      <Badge variant="secondary" className="h-4 px-1 text-[10px]">{total}</Badge>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-80 border-l border-border bg-card/50 p-4 overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: es }) : 'Selecciona un día'}
          </h2>
          {selectedDate && (
            <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="gap-1">
              <Plus size={14} /> Tarea
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {selectedDateTasks.length > 0 ? (
            selectedDateTasks.map((task) => (
              <div key={task.id} className="relative">
                {task.is_recurring && !task.recurring_parent_id && (
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 z-10">
                    <Repeat size={10} className="text-purple-400" />
                  </div>
                )}
                <TaskCard task={task} onEdit={setEditingTask} />
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No hay tareas para este día
            </div>
          )}
        </div>
      </div>

      {(showForm || editingTask) && (
        <TaskForm
          task={editingTask}
          initialDate={selectedDate && !editingTask ? format(selectedDate, "yyyy-MM-dd'T'HH:mm") : undefined}
          onClose={() => { setShowForm(false); setEditingTask(null); }}
        />
      )}
    </div>
  );
}
