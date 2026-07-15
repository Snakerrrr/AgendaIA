import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, CheckSquare, Lightbulb, Calendar,
  Moon, Sun, Target, Timer, BarChart3, Grid3X3, Palette,
  Wallpaper, Columns3, CalendarDays, BellOff, Bell,
  PanelLeftClose, PanelLeftOpen, Repeat,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import type { BgEffect } from './AnimatedBackground';

type NavItem = { id: string; label: string; icon: React.ElementType };
type NavSection = { title: string; items: NavItem[] };

const navSections: NavSection[] = [
  {
    title: 'General',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'focus', label: 'Foco del Día', icon: Target },
    ],
  },
  {
    title: 'Tareas',
    items: [
      { id: 'tasks', label: 'Todas', icon: CheckSquare },
      { id: 'kanban', label: 'Kanban', icon: Columns3 },
      { id: 'eisenhower', label: 'Eisenhower', icon: Grid3X3 },
    ],
  },
  {
    title: 'Planificación',
    items: [
      { id: 'weekly', label: 'Semana', icon: CalendarDays },
      { id: 'calendar', label: 'Calendario', icon: Calendar },
    ],
  },
  {
    title: 'Herramientas',
    items: [
      { id: 'habits', label: 'Hábitos', icon: Repeat },
      { id: 'pomodoro', label: 'Pomodoro', icon: Timer },
      { id: 'ideas', label: 'Ideas', icon: Lightbulb },
      { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
    ],
  },
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
  const { page, setPage, theme, toggleTheme, accentHue, setAccentHue, bgEffect, setBgEffect, sidebarCollapsed, toggleSidebar } = useAppStore();
  const [showPalette, setShowPalette] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [dndEnabled, setDndEnabled] = useState(false);
  const collapsed = sidebarCollapsed;

  useEffect(() => { api.app.getDnd().then(setDndEnabled); }, []);

  const toggleDnd = async () => {
    const next = !dndEnabled;
    setDndEnabled(next);
    await api.app.setDnd(next);
  };

  const closePopups = () => { setShowPalette(false); setShowBgPicker(false); };

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col border-r border-border bg-card transition-all duration-300 ease-in-out scanlines',
        collapsed ? 'w-[60px]' : 'w-[210px]'
      )}
    >
      {/* Header */}
      <div className="flex h-[40px] items-center gap-2 px-3" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <div className="h-6 w-6 shrink-0 rounded bg-primary flex items-center justify-center glow-sm">
          <span className="text-xs font-bold text-primary-foreground">A</span>
        </div>
        {!collapsed && (
          <span className="text-sm font-bold tracking-wider glow-text whitespace-nowrap" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            AGENDA<span className="text-primary">IA</span>
          </span>
        )}
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {navSections.map((section, si) => (
          <div key={section.title} className={si > 0 ? 'mt-3' : ''}>
            {!collapsed && (
              <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {section.title}
              </p>
            )}
            {collapsed && si > 0 && (
              <div className="mx-2 mb-2 border-t border-border/50" />
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = page === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setPage(item.id as typeof page)}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'flex w-full items-center gap-3 rounded px-2.5 py-1.5 text-sm font-medium transition-all duration-200',
                      collapsed && 'justify-center px-0',
                      isActive
                        ? 'bg-primary/15 text-primary glow-border'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <Icon size={16} className={cn('shrink-0', isActive && 'drop-shadow-[0_0_6px_hsl(var(--glow-color)/0.6)]')} />
                    {!collapsed && (
                      <>
                        <span className="truncate">{item.label}</span>
                        {isActive && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-primary animate-glow-pulse" />}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom controls */}
      <div className="border-t border-border p-2 space-y-0.5">
        {/* DND */}
        <button
          onClick={toggleDnd}
          title={collapsed ? (dndEnabled ? 'No Molestar ON' : 'No Molestar') : undefined}
          className={cn(
            'flex w-full items-center gap-3 rounded px-2.5 py-1.5 text-sm font-medium transition-all',
            collapsed && 'justify-center px-0',
            dndEnabled ? 'text-yellow-400 bg-yellow-500/10' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          {dndEnabled ? <BellOff size={15} className="shrink-0" /> : <Bell size={15} className="shrink-0" />}
          {!collapsed && (dndEnabled ? 'No Molestar' : 'Notificaciones')}
        </button>

        {/* Color picker */}
        <button
          onClick={() => { setShowPalette(!showPalette); setShowBgPicker(false); }}
          title={collapsed ? 'Color de acento' : undefined}
          className="flex w-full items-center gap-3 rounded px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
          style={collapsed ? { justifyContent: 'center', padding: '6px 0' } : undefined}
        >
          <Palette size={15} className="shrink-0" />
          {!collapsed && <span className="truncate">Color</span>}
          {!collapsed && (
            <span className="ml-auto h-3 w-3 shrink-0 rounded-full border border-border" style={{ backgroundColor: `hsl(${accentHue}, 72%, 51%)` }} />
          )}
        </button>

        {showPalette && (
          <div className={cn('rounded-lg border border-border bg-popover p-2 animate-scale-in', collapsed && 'absolute left-[64px] bottom-20 z-50 w-[140px]')}>
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
          title={collapsed ? 'Fondo animado' : undefined}
          className={cn(
            'flex w-full items-center gap-3 rounded px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground',
            collapsed && 'justify-center px-0'
          )}
        >
          <Wallpaper size={15} className="shrink-0" />
          {!collapsed && 'Fondo'}
        </button>

        {showBgPicker && (
          <div className={cn('rounded-lg border border-border bg-popover p-2 animate-scale-in space-y-0.5', collapsed && 'absolute left-[64px] bottom-12 z-50 w-[140px]')}>
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
        <button onClick={toggleTheme} title={collapsed ? (theme === 'dark' ? 'Tema Claro' : 'Tema Oscuro') : undefined}
          className={cn(
            'flex w-full items-center gap-3 rounded px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground',
            collapsed && 'justify-center px-0'
          )}>
          {theme === 'dark' ? <Sun size={15} className="shrink-0" /> : <Moon size={15} className="shrink-0" />}
          {!collapsed && (theme === 'dark' ? 'Claro' : 'Oscuro')}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => { closePopups(); toggleSidebar(); }}
          title={collapsed ? 'Expandir' : 'Contraer'}
          className={cn(
            'flex w-full items-center gap-3 rounded px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground',
            collapsed && 'justify-center px-0'
          )}
        >
          {collapsed ? <PanelLeftOpen size={15} className="shrink-0" /> : <PanelLeftClose size={15} className="shrink-0" />}
          {!collapsed && 'Contraer'}
        </button>
      </div>
    </aside>
  );
}
