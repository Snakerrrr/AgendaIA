import React, { useEffect, useState } from 'react';
import { Plus, Lightbulb, ArrowRight, Trash2, Edit2, X, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { useAppStore } from '../store/useAppStore';
import { api } from '../lib/api';
import type { Idea } from '../../shared/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function IdeasPage() {
  const { ideas, loadIdeas, loadTasks, loadDashboardStats } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    loadIdeas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingId) {
      await api.ideas.update(editingId, { title: title.trim(), content: content.trim() || undefined });
      setEditingId(null);
    } else {
      await api.ideas.create({ title: title.trim(), content: content.trim() || undefined });
    }

    setTitle('');
    setContent('');
    setShowForm(false);
    await loadIdeas();
  };

  const handleEdit = (idea: Idea) => {
    setEditingId(idea.id);
    setTitle(idea.title);
    setContent(idea.content ?? '');
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    await api.ideas.delete(id);
    await loadIdeas();
  };

  const handleConvert = async (id: number) => {
    await api.ideas.convertToTask(id);
    await Promise.all([loadIdeas(), loadTasks(), loadDashboardStats()]);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  const activeIdeas = ideas.filter((i) => !i.is_converted);
  const convertedIdeas = ideas.filter((i) => i.is_converted);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ideas</h1>
          <p className="text-sm text-muted-foreground">
            Captura tus ideas rápidamente y conviértelas en tareas
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setTitle('');
            setContent('');
          }}
          className="gap-2"
        >
          <Plus size={16} />
          Nueva Idea
        </Button>
      </div>

      {/* Quick form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-lg border border-border bg-card p-4"
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="¿Qué tienes en mente?"
            className="mb-3"
            autoFocus
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Detalles (opcional)..."
            rows={3}
            className="mb-3"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
              <X size={14} className="mr-1" />
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={!title.trim()}>
              <Check size={14} className="mr-1" />
              {editingId ? 'Guardar' : 'Agregar Idea'}
            </Button>
          </div>
        </form>
      )}

      {/* Active ideas */}
      <div className="space-y-2">
        {activeIdeas.length > 0 ? (
          activeIdeas.map((idea) => (
            <div
              key={idea.id}
              className="group rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/30"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-yellow-500/10 p-1.5">
                  <Lightbulb size={16} className="text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm">{idea.title}</h3>
                  {idea.content && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-3">
                      {idea.content}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {format(parseISO(idea.created_at), "d 'de' MMM, HH:mm", {
                      locale: es,
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleConvert(idea.id)}
                    className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                    title="Convertir en tarea"
                  >
                    <ArrowRight size={12} />
                    Tarea
                  </button>
                  <button
                    onClick={() => handleEdit(idea)}
                    className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(idea.id)}
                    className="rounded p-1.5 text-muted-foreground hover:bg-destructive/20 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <Lightbulb size={40} className="mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              No hay ideas todavía
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Captura lo que se te ocurra y transfórmalo en acción
            </p>
          </div>
        )}
      </div>

      {/* Converted ideas */}
      {convertedIdeas.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Convertidas en tareas ({convertedIdeas.length})
          </h2>
          <div className="space-y-2">
            {convertedIdeas.map((idea) => (
              <div
                key={idea.id}
                className="rounded-lg border border-border bg-card/50 p-3 opacity-60"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb size={14} className="text-muted-foreground" />
                  <span className="text-sm line-through">{idea.title}</span>
                  <Badge variant="success" className="ml-auto text-xs">
                    Convertida
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
