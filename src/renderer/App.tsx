import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { AnimatedBackground } from './components/AnimatedBackground';
import { SearchModal } from './components/SearchModal';
import { Dashboard } from './pages/Dashboard';
import { TasksPage } from './pages/TasksPage';
import { IdeasPage } from './pages/IdeasPage';
import { CalendarPage } from './pages/CalendarPage';
import { FocusPage } from './pages/FocusPage';
import { PomodoroPage } from './pages/PomodoroPage';
import { StatsPage } from './pages/StatsPage';
import { EisenhowerPage } from './pages/EisenhowerPage';
import { KanbanPage } from './pages/KanbanPage';
import { WeeklyPage } from './pages/WeeklyPage';
import { TaskForm } from './components/TaskForm';
import { useAppStore } from './store/useAppStore';
import type { Task } from '../shared/types';

declare global {
  interface Window {
    onQuickAdd?: (callback: () => void) => void;
    onOpenSearch?: (callback: () => void) => void;
  }
}

const pages = {
  dashboard: Dashboard,
  tasks: TasksPage,
  ideas: IdeasPage,
  calendar: CalendarPage,
  focus: FocusPage,
  pomodoro: PomodoroPage,
  stats: StatsPage,
  eisenhower: EisenhowerPage,
  kanban: KanbanPage,
  weekly: WeeklyPage,
};

export function App() {
  const { page, initTheme, bgEffect, accentHue } = useAppStore();
  const [quickAdd, setQuickAdd] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [editFromSearch, setEditFromSearch] = useState<Task | null>(null);

  useEffect(() => {
    initTheme();
    window.onQuickAdd?.(() => setQuickAdd(true));
    window.onOpenSearch?.(() => setShowSearch(true));

    const handleKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true); }
      if (e.key === 'Escape' && showSearch) setShowSearch(false);
    };
    document.addEventListener('keydown', handleKeys);
    return () => document.removeEventListener('keydown', handleKeys);
  }, [showSearch]);

  const Page = pages[page];

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="relative flex-1 overflow-hidden">
        <AnimatedBackground effect={bgEffect} accentHue={accentHue} />
        <div className="relative z-10 h-[40px] w-full" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />
        <div className="relative z-10 h-[calc(100vh-40px)]">
          <Page />
        </div>
      </main>

      {quickAdd && <TaskForm onClose={() => setQuickAdd(false)} />}
      {editFromSearch && <TaskForm task={editFromSearch} onClose={() => setEditFromSearch(null)} />}
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} onEditTask={(t) => { setShowSearch(false); setEditFromSearch(t); }} />}
    </div>
  );
}
