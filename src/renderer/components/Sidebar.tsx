import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, CheckSquare, Lightbulb, Calendar,
  Moon, Sun, Target, Timer, BarChart3, Grid3X3, Palette,
  Wallpaper, Columns3, CalendarDays, BellOff, Bell, Search,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import type { BgEffect } from './AnimatedBackground';

const navItems = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'focus' as const, label: 'Foco del Día', icon: Target },
  { id: 'tasks' as const, label: 'Tareas', icon: CheckSquare },
  { id: 'kanban' as const, label: 'Kanban', icon: Columns3 },
  { id: 'eisenhower' as const, label: 'Eisenhower', icon: Grid3X3 },
  { id: 'weekly' as const, label: 'Semana', icon: CalendarDays },
  { id: 'pomodoro' as const, label: 'Pomodoro', icon: Timer },
  { id: 'ideas' as const, label: 'Ideas', icon: Lightbulb },
  { id: 'calendar' as const, label: 'Calendario', icon: Calendar },
  { id: 'stats' as const, label: 'Estadísticas', icon: BarChart3 },
];

const accentColors = [
  { name: 'Rojo Eva-02', hue: '0', color: '#ef4444' },
  { name: 'Naranja Akira', hue: '25', color: '#f97316' },
  { name: 'Ámbar', hue: '38', color: '#f59e0b' },
  { name: 'Verde Terminal', hue: '142', color: '#22c55e' },
  { name: 'Cyan Ghost', hue: '186', color: '#06b6d4' },
  { name: 'Azul Rei', hue: '217', color: '#3b82f6' },
  { name: 'Violeta Mecha', hue: '263', color: '#8b5cf6' },
  { name: 'Rosa Neon', hue: '330', color: '#ec4899' },
];

const bgOptions: { id: BgEffect; label: string }[] = [
  { id: 'none', label: 'Sin fondo' },
  { id: 'particles', label: 'Partículas' },
  { id: 'sakura', label: 'Sakura' },
  { id: 'space', label: 'Sistema Solar' },
];

export function Sidebar() {
  const { page, setPage, theme, toggleTheme, accentHue, setAccentHue, bgEffect, setBgEffect } = useAppStore();
  const [showPalette, setShowPalette] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [dndEnabled, setDndEnabled] = useState(false);

  useEffect(() => { api.app.getDnd().then(setDndEnabled); }, []);

  const toggleDnd = async () => {
    const next = !dndEnabled;
    setDndEnabled(next);
    await api.app.setDnd(next);
  };

  return (
    <aside className="relative flex h-full w-[220px] flex-col border-r border-border bg-card scanlines">
      <div className="flex h-[40px] items-center gap-2 px-4" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <div className="h-6 w-6 rounded bg-primary flex items-center justify-center glow-sm">
          <span className="text-xs font-bold text-primary-foreground">A</span>
        </div>
        <span className="text-sm font-bold tracking-wider glow-text" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          AGENDA<span className="text-primary">IA</span>
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-3 overflow-y-auto">
        {navItems.map((item, i) => {
          const Icon = item.icon;
          const isActive = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded px-3 py-1.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/15 text-primary glow-border corner-accent'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground hover:translate-x-1'
              )}
            >
              <Icon size={15} className={isActive ? 'drop-shadow-[0_0_6px_hsl(var(--glow-color)/0.6)]' : ''} />
              {item.label}
              {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-glow-pulse" />}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-border p-2 space-y-0.5">
        {/* DND toggle */}
        <button
          onClick={toggleDnd}
          className={cn(
            'flex w-full items-center gap-3 rounded px-3 py-1.5 text-sm font-medium transition-all',
            dndEnabled ? 'text-yellow-400 bg-yellow-500/10' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          {dndEnabled ? <BellOff size={15} /> : <Bell size={15} />}
          {dndEnabled ? 'No Molestar ON' : 'No Molestar'}
        </button>

        {/* Color picker */}
        <button
          onClick={() => { setShowPalette(!showPalette); setShowBgPicker(false); }}
          className="flex w-full items-center gap-3 rounded px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
        >
          <Palette size={15} />
          Color
          <span className="ml-auto h-3 w-3 rounded-full border border-border" style={{ backgroundColor: `hsl(${accentHue}, 72%, 51%)` }} />
        </button>

        {showPalette && (
          <div className="rounded-lg border border-border bg-popover p-2 animate-scale-in">
            <div className="grid grid-cols-4 gap-1.5">
              {accentColors.map((c) => (
                <button key={c.hue} onClick={() => { setAccentHue(c.hue); setShowPalette(false); }} title={c.name}
                  className={cn('h-6 w-6 rounded-full transition-all hover:scale-110 mx-auto',
                    accentHue === c.hue && 'ring-2 ring-offset-1 ring-offset-background ring-foreground scale-110'
                  )} style={{ backgroundColor: c.color, boxShadow: `0 0 8px ${c.color}40` }} />
              ))}
            </div>
          </div>
        )}

        {/* BG picker */}
        <button
          onClick={() => { setShowBgPicker(!showBgPicker); setShowPalette(false); }}
          className="flex w-full items-center gap-3 rounded px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
        >
          <Wallpaper size={15} />
          Fondo
        </button>

        {showBgPicker && (
          <div className="rounded-lg border border-border bg-popover p-2 animate-scale-in space-y-0.5">
            {bgOptions.map((opt) => (
              <button key={opt.id} onClick={() => { setBgEffect(opt.id); setShowBgPicker(false); }}
                className={cn('flex w-full items-center gap-2 rounded px-2 py-1 text-xs font-medium transition-all',
                  bgEffect === opt.id ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}>
                {bgEffect === opt.id && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Theme toggle */}
        <button onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground">
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          {theme === 'dark' ? 'Claro' : 'Oscuro'}
        </button>
      </div>
    </aside>
  );
}
