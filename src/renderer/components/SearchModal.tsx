import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CheckSquare, Lightbulb, Bell, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import type { Task, Idea, Reminder, SearchResults } from '../../shared/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface SearchModalProps {
  onClose: () => void;
  onEditTask: (task: Task) => void;
}

export function SearchModal({ onClose, onEditTask }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setPage } = useAppStore();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults(null); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      const r = await api.search.global(query.trim());
      setResults(r);
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const total = results ? results.tasks.length + results.ideas.length + results.reminders.length : 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] bg-black/60 animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl animate-scale-in glow-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search size={18} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar tareas, ideas, recordatorios..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {!query.trim() && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Escribe para buscar en toda la aplicación
            </div>
          )}

          {query.trim() && results && total === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No se encontraron resultados para "{query}"
            </div>
          )}

          {results && results.tasks.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                Tareas ({results.tasks.length})
              </p>
              {results.tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => { onEditTask(task); onClose(); }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                >
                  <CheckSquare size={14} className={task.status === 'completed' ? 'text-green-400' : 'text-primary'} />
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-medium truncate', task.status === 'completed' && 'line-through text-muted-foreground')}>
                      {task.title}
                    </p>
                    {task.description && <p className="text-xs text-muted-foreground truncate">{task.description}</p>}
                  </div>
                  {task.category_name && (
                    <span className="text-[10px] text-muted-foreground">{task.category_name}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {results && results.ideas.length > 0 && (
            <div className="p-2 border-t border-border">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                Ideas ({results.ideas.length})
              </p>
              {results.ideas.map((idea) => (
                <button
                  key={idea.id}
                  onClick={() => { setPage('ideas'); onClose(); }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                >
                  <Lightbulb size={14} className="text-yellow-400" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{idea.title}</p>
                    {idea.content && <p className="text-xs text-muted-foreground truncate">{idea.content}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {results && results.reminders.length > 0 && (
            <div className="p-2 border-t border-border">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                Recordatorios ({results.reminders.length})
              </p>
              {results.reminders.map((rem) => (
                <div key={rem.id} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm">
                  <Bell size={14} className="text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{rem.task_title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(rem.remind_at), "dd MMM, HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
