import React, { useEffect, useState } from 'react';
import { Repeat, Plus, Pause, Play, Trash2, Edit2, X, Check, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { useAppStore } from '../store/useAppStore';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import type { Habit, CreateHabitInput, RecurrenceType, Priority } from '../../shared/types';

const recurrenceLabels: Record<string, string> = { daily: 'Diario', weekly: 'Semanal', monthly: 'Mensual' };

export function HabitsPage() {
  const { habits, loadHabits, categories, loadCategories, loadTasks } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [categoryId, setCategoryId] = useState('');
  const [recType, setRecType] = useState<RecurrenceType>('daily');
  const [recInterval, setRecInterval] = useState(1);
  const [schedHour, setSchedHour] = useState(9);
  const [schedMinute, setSchedMinute] = useState(0);

  useEffect(() => { loadHabits(); loadCategories(); }, []);

  const resetForm = () => { setTitle(''); setDescription(''); setPriority('medium'); setCategoryId(''); setRecType('daily'); setRecInterval(1); setSchedHour(9); setSchedMinute(0); setEditing(null); setShowForm(false); };

  const openEdit = (h: Habit) => {
    setEditing(h); setTitle(h.title); setDescription(h.description ?? ''); setPriority(h.priority);
    setCategoryId(h.category_id?.toString() ?? ''); setRecType(h.recurrence_type); setRecInterval(h.recurrence_interval);
    setSchedHour(h.scheduled_hour); setSchedMinute(h.scheduled_minute); setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const input: CreateHabitInput = {
      title: title.trim(), description: description.trim() || undefined, priority,
      category_id: categoryId ? parseInt(categoryId) : null,
      recurrence_type: recType, recurrence_interval: recInterval,
      scheduled_hour: schedHour, scheduled_minute: schedMinute,
    };
    if (editing) { await api.habits.update(editing.id, input); }
    else { await api.habits.create(input); }
    await api.habits.generateDaily();
    await Promise.all([loadHabits(), loadTasks()]);
    resetForm();
  };

  const handleDelete = async (id: number) => {
    await api.habits.delete(id);
    await Promise.all([loadHabits(), loadTasks()]);
  };

  const handleToggle = async (id: number) => {
    await api.habits.toggleActive(id);
    await loadHabits();
  };

  const activeHabits = habits.filter((h) => h.is_active);
  const pausedHabits = habits.filter((h) => !h.is_active);

  const categoryOptions = [{ value: '', label: 'Sin categoría' }, ...categories.map((c) => ({ value: c.id.toString(), label: c.name }))];
  const recOptions = [{ value: 'daily', label: 'Diario' }, { value: 'weekly', label: 'Semanal' }, { value: 'monthly', label: 'Mensual' }];
  const priorityOptions = [{ value: 'low', label: 'Baja' }, { value: 'medium', label: 'Media' }, { value: 'high', label: 'Alta' }];

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 glow-text">
            <Repeat className="text-primary" size={24} /> Hábitos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Tareas que se repiten automáticamente</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2 glow-sm">
          <Plus size={16} /> Nuevo Hábito
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-border bg-card p-4 animate-scale-in glow-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{editing ? 'Editar Hábito' : 'Nuevo Hábito'}</h3>
            <button type="button" onClick={resetForm} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Beber agua, Ejercicio, Leer..." autoFocus required />
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notas (opcional)" rows={2} />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Prioridad</label>
              <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} options={priorityOptions} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Categoría</label>
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} options={categoryOptions} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Frecuencia</label>
              <Select value={recType} onChange={(e) => setRecType(e.target.value as RecurrenceType)} options={recOptions} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cada</label>
              <Input type="number" min={1} max={30} value={recInterval} onChange={(e) => setRecInterval(parseInt(e.target.value) || 1)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Hora</label>
              <Input type="number" min={0} max={23} value={schedHour} onChange={(e) => setSchedHour(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Minuto</label>
              <Input type="number" min={0} max={59} step={5} value={schedMinute} onChange={(e) => setSchedMinute(parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
            <Button type="submit" disabled={!title.trim()}>{editing ? 'Guardar' : 'Crear Hábito'}</Button>
          </div>
        </form>
      )}

      {/* Active habits */}
      <div className="space-y-2">
        {activeHabits.length > 0 ? activeHabits.map((h) => (
          <HabitCard key={h.id} habit={h} onEdit={openEdit} onDelete={handleDelete} onToggle={handleToggle} />
        )) : (
          <div className="rounded-lg border border-dashed border-border p-10 text-center anime-gradient">
            <Repeat size={36} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">No hay hábitos activos</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Crea tu primer hábito para empezar</p>
          </div>
        )}
      </div>

      {/* Paused habits */}
      {pausedHabits.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase text-muted-foreground/60 tracking-wider mb-2">Pausados ({pausedHabits.length})</p>
          <div className="space-y-2 opacity-60">
            {pausedHabits.map((h) => (
              <HabitCard key={h.id} habit={h} onEdit={openEdit} onDelete={handleDelete} onToggle={handleToggle} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HabitCard({ habit, onEdit, onDelete, onToggle }: { habit: Habit; onEdit: (h: Habit) => void; onDelete: (id: number) => void; onToggle: (id: number) => void }) {
  const todayDone = habit.today_status === 'completed';
  const todaySkipped = habit.today_status === 'cancelled';

  return (
    <div className={cn('group rounded-lg border border-border bg-card p-4 transition-all glow-border hover:glow-border-hover', !habit.is_active && 'opacity-50')}>
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5 rounded-lg p-2', todayDone ? 'bg-green-500/15' : todaySkipped ? 'bg-yellow-500/15' : 'bg-primary/10')}>
          <Repeat size={16} className={todayDone ? 'text-green-400' : todaySkipped ? 'text-yellow-400' : 'text-primary'} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm">{habit.title}</h3>
          {habit.description && <p className="text-xs text-muted-foreground mt-0.5">{habit.description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] text-purple-400">
              {recurrenceLabels[habit.recurrence_type]} {habit.recurrence_interval > 1 ? `(cada ${habit.recurrence_interval})` : ''}
            </Badge>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock size={10} />
              {String(habit.scheduled_hour).padStart(2, '0')}:{String(habit.scheduled_minute).padStart(2, '0')}
            </span>
            {habit.category_name && (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: habit.category_color ?? '#3b82f6' }} />
                {habit.category_name}
              </Badge>
            )}
            {todayDone && <Badge variant="success" className="text-[10px]">Hoy: Hecho</Badge>}
            {todaySkipped && <Badge variant="warning" className="text-[10px]">Hoy: Saltado</Badge>}
            {!todayDone && !todaySkipped && habit.today_status === 'pending' && <Badge variant="outline" className="text-[10px] text-yellow-400">Hoy: Pendiente</Badge>}
          </div>
        </div>
        <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onToggle(habit.id)} className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" title={habit.is_active ? 'Pausar' : 'Reactivar'}>
            {habit.is_active ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button onClick={() => onEdit(habit)} className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"><Edit2 size={14} /></button>
          <button onClick={() => onDelete(habit.id)} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/20 hover:text-red-400"><Trash2 size={14} /></button>
        </div>
      </div>
    </div>
  );
}
