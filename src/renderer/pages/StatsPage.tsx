import React, { useEffect, useState } from 'react';
import { TrendingUp, Flame, Timer, BarChart3 } from 'lucide-react';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import type { ProductivityStats } from '../../shared/types';

export function StatsPage() {
  const [stats, setStats] = useState<ProductivityStats | null>(null);

  useEffect(() => {
    api.pomodoro.getStats().then(setStats);
  }, []);

  if (!stats) return <div className="flex h-full items-center justify-center text-muted-foreground">Cargando estadísticas...</div>;

  const maxDaily = Math.max(...stats.dailyCompletions.map((d) => d.count), 1);
  const weekTrend = stats.tasksCompletedLastWeek > 0
    ? Math.round(((stats.tasksCompletedThisWeek - stats.tasksCompletedLastWeek) / stats.tasksCompletedLastWeek) * 100)
    : stats.tasksCompletedThisWeek > 0 ? 100 : 0;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="text-primary" size={24} />
          Estadísticas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Tu productividad en números</p>
      </div>

      {/* Top stats */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <StatBox
          icon={TrendingUp}
          label="Esta semana"
          value={stats.tasksCompletedThisWeek}
          sub={weekTrend !== 0 ? `${weekTrend > 0 ? '+' : ''}${weekTrend}% vs semana pasada` : 'Sin datos previos'}
          color="text-blue-400"
          bg="bg-blue-500/10"
        />
        <StatBox
          icon={Flame}
          label="Racha actual"
          value={stats.currentStreak}
          sub={`Mejor: ${stats.bestStreak} días`}
          color="text-orange-400"
          bg="bg-orange-500/10"
        />
        <StatBox
          icon={Timer}
          label="Pomodoros hoy"
          value={stats.pomodorosToday}
          sub={`${stats.pomodorosThisWeek} esta semana`}
          color="text-red-400"
          bg="bg-red-500/10"
        />
        <StatBox
          icon={BarChart3}
          label="Sem. pasada"
          value={stats.tasksCompletedLastWeek}
          sub="tareas completadas"
          color="text-purple-400"
          bg="bg-purple-500/10"
        />
      </div>

      {/* Daily completions chart */}
      <div className="mb-6 rounded-lg border border-border bg-card p-4">
        <h3 className="mb-4 text-sm font-semibold">Tareas completadas (últimos 30 días)</h3>
        <div className="flex h-40 items-end gap-1">
          {stats.dailyCompletions.length > 0 ? (
            stats.dailyCompletions.map((day) => (
              <div key={day.date} className="group relative flex-1" title={`${day.date}: ${day.count}`}>
                <div
                  className="w-full rounded-t bg-primary/80 transition-all hover:bg-primary"
                  style={{ height: `${(day.count / maxDaily) * 100}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block rounded bg-popover px-2 py-1 text-xs shadow-lg whitespace-nowrap">
                  {day.date.slice(5)}: {day.count}
                </div>
              </div>
            ))
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              Completa tareas para ver tu progreso aquí
            </div>
          )}
        </div>
      </div>

      {/* By category */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-4 text-sm font-semibold">Completadas por categoría</h3>
        {stats.completionByCategory.length > 0 ? (
          <div className="space-y-3">
            {stats.completionByCategory.map((cat) => {
              const maxCat = Math.max(...stats.completionByCategory.map((c) => c.count), 1);
              return (
                <div key={cat.name} className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="w-24 text-sm truncate">{cat.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(cat.count / maxCat) * 100}%`, backgroundColor: cat.color }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{cat.count}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aún no hay datos por categoría</p>
        )}
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, sub, color, bg }: {
  icon: React.ElementType; label: string; value: number; sub: string; color: string; bg: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className={cn('rounded-lg p-2', bg)}>
          <Icon size={20} className={color} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
