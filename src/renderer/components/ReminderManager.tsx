import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Plus, Trash2, Clock, X } from 'lucide-react';
import { Button } from './ui/button';
import { DateTimePicker } from './ui/date-time-picker';
import { Badge } from './ui/badge';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import type { Reminder } from '../../shared/types';
import { format, parseISO, isPast } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReminderManagerProps {
  taskId: number;
  taskTitle: string;
}

const quickOptions = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '1 hora', minutes: 60 },
  { label: '3 horas', minutes: 180 },
  { label: 'Mañana 9AM', minutes: -1 },
];

export function ReminderManager({ taskId, taskTitle }: ReminderManagerProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [customDate, setCustomDate] = useState('');

  const loadReminders = async () => {
    const r = await api.reminders.getByTask(taskId);
    setReminders(r);
  };

  useEffect(() => { loadReminders(); }, [taskId]);

  const addReminder = async (remindAt: string) => {
    await api.reminders.create({ task_id: taskId, remind_at: remindAt });
    await loadReminders();
    setShowAdd(false);
    setCustomDate('');
  };

  const handleQuickAdd = (minutes: number) => {
    let date: Date;
    if (minutes === -1) {
      date = new Date();
      date.setDate(date.getDate() + 1);
      date.setHours(9, 0, 0, 0);
    } else {
      date = new Date(Date.now() + minutes * 60 * 1000);
    }
    addReminder(format(date, "yyyy-MM-dd'T'HH:mm"));
  };

  const handleDelete = async (id: number) => {
    await api.reminders.delete(id);
    await loadReminders();
  };

  const activeReminders = reminders.filter((r) => !r.is_sent);
  const sentReminders = reminders.filter((r) => r.is_sent);

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Bell size={14} className="text-primary" />
          Recordatorios ({activeReminders.length})
        </label>
        <Button type="button" size="sm" variant="ghost" onClick={() => setShowAdd(!showAdd)} className="h-6 px-2 text-xs">
          {showAdd ? <X size={12} /> : <Plus size={12} />}
        </Button>
      </div>

      {/* Quick add options */}
      {showAdd && (
        <div className="mb-3 space-y-2 animate-scale-in">
          <div className="flex flex-wrap gap-1.5">
            {quickOptions.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => handleQuickAdd(opt.minutes)}
                className="rounded-md border border-border bg-secondary/50 px-2 py-1 text-xs font-medium text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary hover:border-primary/30"
              >
                {opt.label}
              </button>
            ))}
          </div>
          <DateTimePicker
            value={customDate}
            onChange={(val) => { setCustomDate(val); if (val) addReminder(val); }}
            placeholder="Elegir fecha y hora..."
          />
        </div>
      )}

      {/* Active reminders */}
      <div className="space-y-1">
        {activeReminders.map((r) => {
          const isPastDue = isPast(parseISO(r.remind_at));
          return (
            <div key={r.id} className="flex items-center gap-2 group">
              <Clock size={12} className={cn(isPastDue ? 'text-red-400' : 'text-primary')} />
              <span className={cn('flex-1 text-xs', isPastDue ? 'text-red-400' : 'text-muted-foreground')}>
                {format(parseISO(r.remind_at), "dd MMM 'a las' HH:mm", { locale: es })}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(r.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-opacity"
              >
                <Trash2 size={11} />
              </button>
            </div>
          );
        })}
        {sentReminders.length > 0 && (
          <div className="mt-1 pt-1 border-t border-border/50">
            {sentReminders.map((r) => (
              <div key={r.id} className="flex items-center gap-2 opacity-40">
                <BellOff size={11} />
                <span className="text-xs line-through">
                  {format(parseISO(r.remind_at), "dd MMM HH:mm", { locale: es })}
                </span>
              </div>
            ))}
          </div>
        )}
        {reminders.length === 0 && !showAdd && (
          <p className="text-xs text-muted-foreground">Sin recordatorios</p>
        )}
      </div>
    </div>
  );
}
