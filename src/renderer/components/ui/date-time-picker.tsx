import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isSameDay, isToday, addMonths, subMonths,
  startOfWeek, endOfWeek, setHours, setMinutes,
} from 'date-fns';
import { es } from 'date-fns/locale';

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showTime?: boolean;
}

const quickDates = [
  { label: 'Hoy', fn: () => { const d = new Date(); d.setHours(18, 0, 0, 0); return d; } },
  { label: 'Mañana', fn: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d; } },
  { label: 'Pasado mañana', fn: () => { const d = new Date(); d.setDate(d.getDate() + 2); d.setHours(9, 0, 0, 0); return d; } },
  { label: 'Próx. lunes', fn: () => { const d = new Date(); const day = d.getDay(); const diff = day === 0 ? 1 : 8 - day; d.setDate(d.getDate() + diff); d.setHours(9, 0, 0, 0); return d; } },
  { label: 'En 1 semana', fn: () => { const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(9, 0, 0, 0); return d; } },
];

const hours = Array.from({ length: 24 }, (_, i) => i);
const minuteSteps = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export function DateTimePicker({ value, onChange, placeholder = 'Seleccionar fecha...', showTime = true }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  const [hour, setHour] = useState(selectedDate ? selectedDate.getHours() : 9);
  const [minute, setMinute] = useState(selectedDate ? selectedDate.getMinutes() : 0);
  const [tab, setTab] = useState<'date' | 'time'>('date');
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setSelectedDate(d); setHour(d.getHours()); setMinute(d.getMinutes()); setMonth(d);
      }
    }
  }, [value]);

  useLayoutEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropH = 420;
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow > dropH ? rect.bottom + 4 : rect.top - dropH - 4;
      const left = Math.min(rect.left, window.innerWidth - 330);
      setDropdownPos({ top: Math.max(4, top), left: Math.max(4, left) });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (triggerRef.current?.contains(target)) return;
      const dropdown = document.getElementById('dtp-dropdown');
      if (dropdown?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const confirmSelection = (date: Date, h: number, m: number) => {
    const final = setMinutes(setHours(date, h), m);
    onChange(format(final, "yyyy-MM-dd'T'HH:mm"));
    setOpen(false);
  };

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
    if (showTime) { setTab('time'); } else { confirmSelection(day, hour, minute); }
  };

  const handleTimeConfirm = () => {
    if (selectedDate) confirmSelection(selectedDate, hour, minute);
  };

  const handleQuickDate = (fn: () => Date) => {
    const d = fn();
    setSelectedDate(d); setHour(d.getHours()); setMinute(d.getMinutes());
    confirmSelection(d, d.getHours(), d.getMinutes());
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation(); onChange(''); setSelectedDate(null); setOpen(false);
  };

  const mStart = startOfMonth(month);
  const mEnd = endOfMonth(month);
  const calStart = startOfWeek(mStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(mEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const dropdown = open ? createPortal(
    <div
      id="dtp-dropdown"
      className="fixed z-[100] w-[320px] rounded-lg border border-border bg-card p-3 shadow-2xl animate-scale-in glow-border"
      style={{ top: dropdownPos.top, left: dropdownPos.left }}
    >
      {/* Quick dates */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {quickDates.map((q) => (
          <button key={q.label} type="button" onClick={() => handleQuickDate(q.fn)}
            className="rounded-md border border-border bg-secondary/50 px-2 py-1 text-xs font-medium text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary hover:border-primary/30">
            {q.label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      {showTime && (
        <div className="mb-3 flex gap-1 rounded-md bg-secondary/50 p-0.5">
          <button type="button" onClick={() => setTab('date')}
            className={cn('flex-1 flex items-center justify-center gap-1.5 rounded py-1.5 text-xs font-medium transition-all',
              tab === 'date' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground')}>
            <Calendar size={12} /> Fecha
          </button>
          <button type="button" onClick={() => setTab('time')}
            className={cn('flex-1 flex items-center justify-center gap-1.5 rounded py-1.5 text-xs font-medium transition-all',
              tab === 'time' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground')}>
            <Clock size={12} /> Hora
          </button>
        </div>
      )}

      {tab === 'date' && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={() => setMonth(subMonths(month, 1))} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold capitalize">{format(month, 'MMMM yyyy', { locale: es })}</span>
            <button type="button" onClick={() => setMonth(addMonths(month, 1))} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {dayNames.map((d) => <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day) => {
              const inM = isSameMonth(day, month);
              const sel = selectedDate && isSameDay(day, selectedDate);
              const td = isToday(day);
              return (
                <button key={day.toISOString()} type="button" onClick={() => handleDateClick(day)}
                  className={cn('flex h-8 w-full items-center justify-center rounded text-xs font-medium transition-all',
                    !inM && 'opacity-30',
                    sel && 'bg-primary text-primary-foreground shadow-[0_0_8px_hsl(var(--glow-color)/0.4)]',
                    !sel && td && 'border border-primary/50 text-primary',
                    !sel && !td && inM && 'hover:bg-accent hover:text-foreground text-foreground')}>
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </>
      )}

      {tab === 'time' && (
        <div>
          <div className="mb-3 text-center">
            <span className="text-3xl font-bold tabular-nums text-primary glow-text">
              {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
            </span>
            {selectedDate && (
              <p className="text-xs text-muted-foreground mt-1">
                {format(selectedDate, "EEEE dd 'de' MMMM", { locale: es })}
              </p>
            )}
          </div>
          <p className="text-[10px] font-medium text-muted-foreground mb-1">Hora</p>
          <div className="mb-3 grid grid-cols-8 gap-1 max-h-[80px] overflow-y-auto pr-1">
            {hours.map((h) => (
              <button key={h} type="button" onClick={() => setHour(h)}
                className={cn('rounded py-1 text-xs font-medium transition-all',
                  hour === h ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}>
                {String(h).padStart(2, '0')}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-medium text-muted-foreground mb-1">Minutos</p>
          <div className="mb-3 grid grid-cols-6 gap-1">
            {minuteSteps.map((m) => (
              <button key={m} type="button" onClick={() => setMinute(m)}
                className={cn('rounded py-1 text-xs font-medium transition-all',
                  minute === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}>
                :{String(m).padStart(2, '0')}
              </button>
            ))}
          </div>
          <button type="button" onClick={handleTimeConfirm} disabled={!selectedDate}
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 glow-sm">
            Confirmar
          </button>
        </div>
      )}
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { setOpen(!open); setTab('date'); }}
        className={cn(
          'flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm transition-all',
          'hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring',
          !value && 'text-muted-foreground'
        )}
      >
        <Calendar size={14} className="shrink-0 text-muted-foreground" />
        <span className="flex-1 text-left truncate">
          {selectedDate ? format(selectedDate, showTime ? "dd MMM yyyy, HH:mm" : "dd MMM yyyy", { locale: es }) : placeholder}
        </span>
        {value && (
          <button type="button" onClick={handleClear} className="shrink-0 text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        )}
      </button>
      {dropdown}
    </>
  );
}
