import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Repeat } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { TaskForm } from '../components/TaskForm';
import { TaskCard } from '../components/TaskCard';
import { useAppStore } from '../store/useAppStore';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import type { Task, Habit } from '../../shared/types';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isSameDay, isToday, addMonths, subMonths,
  startOfWeek, endOfWeek, differenceInCalendarDays,
} from 'date-fns';
import { es } from 'date-fns/locale';

function isHabitOnDay(habit: Habit, day: Date): boolean {
  const baseDate = new Date(habit.created_at);
  const daysDiff = differenceInCalendarDays(day, new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate()));
  if (daysDiff < 0) return false;
  const interval = habit.recurrence_interval ?? 1;
  switch (habit.recurrence_type) {
    case 'daily': return interval === 1 || daysDiff % interval === 0;
    case 'weekly': return day.getDay() === baseDate.getDay();
    case 'monthly': return day.getDate() === baseDate.getDate();
    default: return false;
  }
}

export function CalendarPage() {
  const { tasks, habits, loadTasks, loadHabits } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedDateTasks, setSelectedDateTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => { loadTasks(); loadHabits(); }, []);

  useEffect(() => {
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      api.tasks.getByDate(dateStr).then(setSelectedDateTasks);
    }
  }, [selectedDate, tasks]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const activeHabits = habits.filter((h) => h.is_active);

  const getCountForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const realCount = tasks.filter((t) => t.due_date?.startsWith(dateStr) && t.status !== 'cancelled').length;
    const habitCount = activeHabits.filter((h) => {
      if (!isHabitOnDay(h, day)) return false;
      return !tasks.some((t) => t.habit_id === h.id && t.due_date?.startsWith(dateStr));
    }).length;
    return { real: realCount, habit: habitCount, total: realCount + habitCount };
  };

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold glow-text">Calendario</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft size={16} /></Button>
            <span className="min-w-[160px] text-center text-sm font-semibold capitalize">{format(currentMonth, 'MMMM yyyy', { locale: es })}</span>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight size={16} /></Button>
            <Button variant="outline" size="sm" onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }}>Hoy</Button>
          </div>
        </div>
        <div className="mb-1 grid grid-cols-7 gap-1">
          {dayNames.map((d) => <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const { real, habit, total } = getCountForDay(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);
            return (
              <button key={day.toISOString()} onClick={() => setSelectedDate(day)}
                className={cn('relative flex h-20 flex-col items-center rounded-lg border p-1.5 text-sm transition-colors',
                  inMonth ? 'border-border' : 'border-transparent opacity-40',
                  isSelected && 'border-primary bg-primary/5',
                  !isSelected && inMonth && 'hover:border-primary/30 hover:bg-accent/50',
                  today && !isSelected && 'border-primary/50')}>
                <span className={cn('flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium',
                  today && 'bg-primary text-primary-foreground', isSelected && !today && 'font-bold text-primary')}>
                  {format(day, 'd')}
                </span>
                {total > 0 && (
                  <div className="mt-auto flex gap-0.5 items-center">
                    {real > 0 && Array.from({ length: Math.min(real, 3) }).map((_, i) => <span key={i} className="h-1.5 w-1.5 rounded-full bg-primary" />)}
                    {habit > 0 && <Repeat size={10} className="text-purple-400" />}
                    {total > 3 && <Badge variant="secondary" className="h-4 px-1 text-[10px]">{total}</Badge>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-80 border-l border-border bg-card/50 p-4 overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: es }) : 'Selecciona un día'}</h2>
          {selectedDate && <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="gap-1"><Plus size={14} /> Tarea</Button>}
        </div>
        <div className="space-y-2">
          {selectedDateTasks.length > 0 ? selectedDateTasks.map((t) => <TaskCard key={t.id} task={t} onEdit={setEditingTask} />)
            : <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No hay tareas para este día</div>}

          {/* Projected habits for future days */}
          {selectedDate && activeHabits.filter((h) => {
            if (!isHabitOnDay(h, selectedDate)) return false;
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            return !selectedDateTasks.some((t) => t.habit_id === h.id);
          }).map((h) => (
            <div key={`habit-${h.id}`} className="rounded border border-dashed border-purple-500/30 bg-purple-500/5 p-3">
              <div className="flex items-center gap-2">
                <Repeat size={14} className="text-purple-400" />
                <span className="text-sm font-medium">{h.title}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Hábito proyectado - {String(h.scheduled_hour).padStart(2, '0')}:{String(h.scheduled_minute).padStart(2, '0')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {(showForm || editingTask) && (
        <TaskForm task={editingTask} initialDate={selectedDate && !editingTask ? format(selectedDate, "yyyy-MM-dd'T'HH:mm") : undefined}
          onClose={() => { setShowForm(false); setEditingTask(null); }} />
      )}
    </div>
  );
}
