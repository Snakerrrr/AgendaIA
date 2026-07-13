import { create } from 'zustand';
import type { Task, Idea, Category, Reminder, DashboardStats, TaskStatus, Priority } from '../../shared/types';
import { api } from '../lib/api';
import type { BgEffect } from '../components/AnimatedBackground';

type Page = 'dashboard' | 'tasks' | 'ideas' | 'calendar' | 'focus' | 'pomodoro' | 'stats' | 'eisenhower' | 'kanban' | 'weekly';

function applyAccentHue(hue: string): void {
  document.documentElement.style.setProperty('--accent-hue', hue);
}

interface AppState {
  page: Page;
  theme: 'light' | 'dark';
  accentHue: string;
  bgEffect: BgEffect;
  sidebarCollapsed: boolean;
  tasks: Task[];
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

  setAccentHue: (hue) => {
    set({ accentHue: hue });
    applyAccentHue(hue);
    localStorage.setItem('accent-hue', hue);
  },

  setBgEffect: (effect) => {
    set({ bgEffect: effect });
    localStorage.setItem('bg-effect', effect);
  },

  toggleSidebar: () => {
    const next = !get().sidebarCollapsed;
    set({ sidebarCollapsed: next });
    localStorage.setItem('sidebar-collapsed', String(next));
  },

  initTheme: async () => {
    const theme = await api.theme.get();
    set({ theme });
    document.documentElement.classList.toggle('dark', theme === 'dark');

    const savedHue = localStorage.getItem('accent-hue') ?? '0';
    set({ accentHue: savedHue });
    applyAccentHue(savedHue);

    const savedBg = (localStorage.getItem('bg-effect') ?? 'particles') as BgEffect;
    set({ bgEffect: savedBg });
  },

  loadTasks: async (filter) => {
    const tasks = await api.tasks.getAll(filter);
    set({ tasks });
  },

  loadIdeas: async () => {
    const ideas = await api.ideas.getAll();
    set({ ideas });
  },

  loadCategories: async () => {
    const categories = await api.categories.getAll();
    set({ categories });
  },

  loadReminders: async () => {
    const reminders = await api.reminders.getAll();
    set({ reminders });
  },

  loadDashboardStats: async () => {
    const dashboardStats = await api.tasks.getDashboardStats();
    set({ dashboardStats });
  },

  loadAll: async () => {
    set({ isLoading: true });
    await Promise.all([
      get().loadTasks(),
      get().loadIdeas(),
      get().loadCategories(),
      get().loadReminders(),
      get().loadDashboardStats(),
    ]);
    set({ isLoading: false });
  },
}));
