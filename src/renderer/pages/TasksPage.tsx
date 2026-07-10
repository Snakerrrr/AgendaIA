import React, { useEffect, useState } from 'react';
import { Plus, Filter, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { TaskCard } from '../components/TaskCard';
import { TaskForm } from '../components/TaskForm';
import { useAppStore } from '../store/useAppStore';
import type { Task, TaskStatus, Priority } from '../../shared/types';

export function TasksPage() {
  const { tasks, categories, loadTasks, loadCategories } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  useEffect(() => {
    loadTasks();
    loadCategories();
  }, []);

  useEffect(() => {
    const filter: { status?: TaskStatus; priority?: Priority; category_id?: number } = {};
    if (statusFilter) filter.status = statusFilter as TaskStatus;
    if (priorityFilter) filter.priority = priorityFilter as Priority;
    if (categoryFilter) filter.category_id = parseInt(categoryFilter);
    loadTasks(filter);
  }, [statusFilter, priorityFilter, categoryFilter]);

  const filteredTasks = searchQuery
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tasks;

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'in_progress', label: 'En progreso' },
    { value: 'completed', label: 'Completada' },
    { value: 'cancelled', label: 'Cancelada' },
  ];

  const priorityOptions = [
    { value: '', label: 'Todas las prioridades' },
    { value: 'high', label: 'Alta' },
    { value: 'medium', label: 'Media' },
    { value: 'low', label: 'Baja' },
  ];

  const categoryOptions = [
    { value: '', label: 'Todas las categorías' },
    ...categories.map((c) => ({ value: c.id.toString(), label: c.name })),
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tareas</h1>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus size={16} />
          Nueva Tarea
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tareas..."
            className="pl-9"
          />
        </div>
        <Filter size={16} className="text-muted-foreground" />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={statusOptions}
          className="w-44"
        />
        <Select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          options={priorityOptions}
          className="w-44"
        />
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={categoryOptions}
          className="w-44"
        />
      </div>

      {/* Task list */}
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={setEditingTask} />
          ))
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-medium text-muted-foreground">
                {searchQuery || statusFilter || priorityFilter || categoryFilter
                  ? 'No se encontraron tareas con esos filtros'
                  : 'No hay tareas todavía'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Crea tu primera tarea para comenzar a organizarte
              </p>
              <Button onClick={() => setShowForm(true)} className="mt-4 gap-2">
                <Plus size={16} />
                Crear Tarea
              </Button>
            </div>
          </div>
        )}
      </div>

      {(showForm || editingTask) && (
        <TaskForm
          task={editingTask}
          onClose={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}
