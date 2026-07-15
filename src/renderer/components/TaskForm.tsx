import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select } from './ui/select';
import { DateTimePicker } from './ui/date-time-picker';
import { ReminderManager } from './ReminderManager';
import { useAppStore } from '../store/useAppStore';
import { api } from '../lib/api';
import type { Task, Priority, Urgency, Subtask } from '../../shared/types';

interface TaskFormProps {
  task?: Task | null;
  onClose: () => void;
  initialDate?: string;
}

export function TaskForm({ task, onClose, initialDate }: TaskFormProps) {
  const { categories, loadTasks, loadDashboardStats, loadCategories } = useAppStore();
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium');
  const [urgency, setUrgency] = useState<Urgency>(task?.urgency ?? 'not_urgent');
  const [categoryId, setCategoryId] = useState<string>(task?.category_id?.toString() ?? '');
  const [dueDate, setDueDate] = useState(task?.due_date?.slice(0, 16) ?? initialDate ?? '');
  const [reminderAt, setReminderAt] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => {
    if (task) {
      setTitle(task.title); setDescription(task.description ?? ''); setPriority(task.priority);
      setUrgency(task.urgency ?? 'not_urgent'); setCategoryId(task.category_id?.toString() ?? '');
      setDueDate(task.due_date?.slice(0, 16) ?? '');
      api.subtasks.getByTask(task.id).then(setSubtasks);
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const input = {
        title: title.trim(), description: description.trim() || undefined, priority, urgency,
        category_id: categoryId ? parseInt(categoryId) : null, due_date: dueDate || null,
      };
      let savedTask: Task;
      if (task) { savedTask = await api.tasks.update({ ...input, id: task.id }); }
      else { savedTask = await api.tasks.create(input); }
      if (reminderAt) await api.reminders.create({ task_id: savedTask.id, remind_at: reminderAt });
      await Promise.all([loadTasks(), loadDashboardStats()]);
      onClose();
    } finally { setSaving(false); }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim() || !task) return;
    const st = await api.subtasks.create({ task_id: task.id, title: newSubtask.trim() });
    setSubtasks([...subtasks, st]); setNewSubtask('');
  };

  const priorityOptions = [{ value: 'low', label: 'Baja' }, { value: 'medium', label: 'Media' }, { value: 'high', label: 'Alta (Importante)' }];
  const urgencyOptions = [{ value: 'not_urgent', label: 'No urgente' }, { value: 'urgent', label: 'Urgente' }];
  const categoryOptions = [{ value: '', label: 'Sin categoría' }, ...categories.map((c) => ({ value: c.id.toString(), label: c.name }))];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl animate-scale-in glow-border">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold glow-text">{task ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Título</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="¿Qué necesitas hacer?" autoFocus required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Descripción</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles adicionales..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="mb-1.5 block text-sm font-medium">Prioridad</label><Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} options={priorityOptions} /></div>
            <div><label className="mb-1.5 block text-sm font-medium">Urgencia</label><Select value={urgency} onChange={(e) => setUrgency(e.target.value as Urgency)} options={urgencyOptions} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="mb-1.5 block text-sm font-medium">Categoría</label><Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} options={categoryOptions} /></div>
            <div><label className="mb-1.5 block text-sm font-medium">Fecha límite</label><DateTimePicker value={dueDate} onChange={setDueDate} placeholder="Elegir fecha y hora..." /></div>
          </div>
          {task ? <ReminderManager taskId={task.id} taskTitle={task.title} />
            : <div><label className="mb-1.5 block text-sm font-medium">Recordatorio</label><DateTimePicker value={reminderAt} onChange={setReminderAt} placeholder="Programar recordatorio..." /></div>}

          {task && (
            <div className="rounded-lg border border-border p-3">
              <label className="mb-2 block text-sm font-medium">Subtareas</label>
              <div className="space-y-1.5 mb-2">
                {subtasks.map((st) => (
                  <div key={st.id} className="flex items-center gap-2 group">
                    <input type="checkbox" checked={!!st.is_completed} onChange={async () => { const u = await api.subtasks.toggle(st.id); setSubtasks(subtasks.map(s=>s.id===st.id?u:s)); }} className="rounded border-input" />
                    <span className={`flex-1 text-sm ${st.is_completed?'line-through text-muted-foreground':''}`}>{st.title}</span>
                    <button type="button" onClick={async () => { await api.subtasks.delete(st.id); setSubtasks(subtasks.filter(s=>s.id!==st.id)); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} placeholder="Agregar subtarea..." className="h-8 text-sm"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }} />
                <Button type="button" size="sm" variant="outline" onClick={handleAddSubtask} disabled={!newSubtask.trim()}><Plus size={14} /></Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving || !title.trim()}>{saving ? 'Guardando...' : task ? 'Guardar' : 'Crear Tarea'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
