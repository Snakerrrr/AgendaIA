import { create } from 'zustand';
import type { Task, Idea, Category, Reminder, Habit, DashboardStats, TaskStatus, Priority } from '../../shared/types';
import { api } from '../lib/api';
import type { BgEffect } from '../components/AnimatedBackground';

type Page = 'dashboard' | 'tasks' | 'ideas' | 'calendar' | 'focus' | 'pomodoro' | 'stats' | 'eisenhower' | 'kanban' | 'weekly' | 'habits';

function applyAccentHue(hue: string): void { document.documentElement.style.setProperty('--accent-hue', hue); }

interface AppState {
  page: Page;
  theme: 'light' | 'dark';
  accentHue: string;
  bgEffect: BgEffect;
  sidebarCollapsed: boolean;
  tasks: Task[];
  habits: Habit[];
  ideas: Idea[];
  categories: Category[];
  reminders: Reminder[];
  dashboardStats: DashboardStats | null;
  isLoading: boolean;

  setPage: (page: Page) => void;
  toggleTheme: () => void;
  setAccentHue: (hue: string) => void;
  setBgEffect: (effect: BgEffect) => void;
  toggleSidebar: () => void;
  initTheme: () => Promise<void>;

  loadTasks: (filter?: { status?: TaskStatus; priority?: Priority; category_id?: number }) => Promise<void>;
  loadHabits: () => Promise<void>;
  loadIdeas: () => Promise<void>;
  loadCategories: () => Promise<void>;
  loadReminders: () => Promise<void>;
  loadDashboardStats: () => Promise<void>;
  loadAll: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  page: 'dashboard',
  theme: 'dark',
  accentHue: '0',
  bgEffect: 'particles' as BgEffect,
  sidebarCollapsed: localStorage.getItem('sidebar-collapsed') === 'true',
  tasks: [],
  habits: [],
  ideas: [],
  categories: [],
  reminders: [],
  dashboardStats: null,
  isLoading: false,

  setPage: (page) => set({ page }),

  toggleTheme: async () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: newTheme });
    await api.theme.set(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  },

  setAccentHue: (hue) => { set({ accentHue: hue }); applyAccentHue(hue); localStorage.setItem('accent-hue', hue); },
  setBgEffect: (effect) => { set({ bgEffect: effect }); localStorage.setItem('bg-effect', effect); },
  toggleSidebar: () => { const next = !get().sidebarCollapsed; set({ sidebarCollapsed: next }); localStorage.setItem('sidebar-collapsed', String(next)); },

  initTheme: async () => {
    const theme = await api.theme.get();
    set({ theme }); document.documentElement.classList.toggle('dark', theme === 'dark');
    const savedHue = localStorage.getItem('accent-hue') ?? '0'; set({ accentHue: savedHue }); applyAccentHue(savedHue);
    const savedBg = (localStorage.getItem('bg-effect') ?? 'particles') as BgEffect; set({ bgEffect: savedBg });
  },

  loadTasks: async (filter) => { set({ tasks: await api.tasks.getAll(filter) }); },
  loadHabits: async () => { set({ habits: await api.habits.getAll() }); },
  loadIdeas: async () => { set({ ideas: await api.ideas.getAll() }); },
  loadCategories: async () => { set({ categories: await api.categories.getAll() }); },
  loadReminders: async () => { set({ reminders: await api.reminders.getAll() }); },
  loadDashboardStats: async () => { set({ dashboardStats: await api.tasks.getDashboardStats() }); },

  loadAll: async () => {
    set({ isLoading: true });
    await Promise.all([get().loadTasks(), get().loadHabits(), get().loadIdeas(), get().loadCategories(), get().loadReminders(), get().loadDashboardStats()]);
    set({ isLoading: false });
  },
}));
