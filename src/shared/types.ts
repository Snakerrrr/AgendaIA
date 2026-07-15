export type Priority = 'low' | 'medium' | 'high';
export type Urgency = 'not_urgent' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type RecurrenceType = 'daily' | 'weekly' | 'monthly';

export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string | null;
}

export interface Habit {
  id: number;
  title: string;
  description: string | null;
  priority: Priority;
  urgency: Urgency;
  category_id: number | null;
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
  scheduled_hour: number;
  scheduled_minute: number;
  is_active: number;
  created_at: string;
  category_name?: string;
  category_color?: string;
  today_status?: TaskStatus | null;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  priority: Priority;
  urgency: Urgency;
  status: TaskStatus;
  category_id: number | null;
  due_date: string | null;
  is_focus: number;
  habit_id: number | null;
  created_at: string;
  updated_at: string;
  category_name?: string;
  category_color?: string;
  subtasks?: Subtask[];
}

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  is_completed: number;
  sort_order: number;
  created_at: string;
}

export interface Reminder {
  id: number;
  task_id: number;
  remind_at: string;
  is_sent: number;
  created_at: string;
  task_title?: string;
}

export interface Idea {
  id: number;
  title: string;
  content: string | null;
  is_converted: number;
  task_id: number | null;
  created_at: string;
}

export interface PomodoroSession {
  id: number;
  task_id: number | null;
  duration_minutes: number;
  type: 'focus' | 'short_break' | 'long_break';
  completed_at: string;
  task_title?: string;
}

export interface ProductivityStats {
  tasksCompletedThisWeek: number;
  tasksCompletedLastWeek: number;
  currentStreak: number;
  bestStreak: number;
  pomodorosToday: number;
  pomodorosThisWeek: number;
  completionByCategory: { name: string; color: string; count: number }[];
  dailyCompletions: { date: string; count: number }[];
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: Priority;
  urgency?: Urgency;
  status?: TaskStatus;
  category_id?: number | null;
  due_date?: string | null;
  is_focus?: boolean;
  habit_id?: number | null;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: number;
}

export interface CreateHabitInput {
  title: string;
  description?: string;
  priority?: Priority;
  urgency?: Urgency;
  category_id?: number | null;
  recurrence_type?: RecurrenceType;
  recurrence_interval?: number;
  scheduled_hour?: number;
  scheduled_minute?: number;
}

export interface CreateReminderInput {
  task_id: number;
  remind_at: string;
}

export interface CreateIdeaInput {
  title: string;
  content?: string;
}

export interface CreateCategoryInput {
  name: string;
  color?: string;
  icon?: string;
}

export interface CreateSubtaskInput {
  task_id: number;
  title: string;
}

export interface DashboardStats {
  totalToday: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export interface SearchResults {
  tasks: Task[];
  ideas: Idea[];
  reminders: Reminder[];
}

export interface IpcApi {
  tasks: {
    getAll: (filter?: { status?: TaskStatus; priority?: Priority; category_id?: number; urgency?: Urgency }) => Promise<Task[]>;
    getById: (id: number) => Promise<Task | null>;
    create: (input: CreateTaskInput) => Promise<Task>;
    update: (input: UpdateTaskInput) => Promise<Task>;
    delete: (id: number) => Promise<void>;
    skip: (id: number) => Promise<void>;
    getByDate: (date: string) => Promise<Task[]>;
    getDashboardStats: () => Promise<DashboardStats>;
    getFocusTasks: () => Promise<Task[]>;
    setFocus: (id: number, isFocus: boolean) => Promise<void>;
  };
  habits: {
    getAll: () => Promise<Habit[]>;
    create: (input: CreateHabitInput) => Promise<Habit>;
    update: (id: number, input: Partial<CreateHabitInput>) => Promise<Habit>;
    delete: (id: number) => Promise<void>;
    toggleActive: (id: number) => Promise<Habit>;
    generateDaily: () => Promise<void>;
  };
  subtasks: {
    getByTask: (taskId: number) => Promise<Subtask[]>;
    create: (input: CreateSubtaskInput) => Promise<Subtask>;
    toggle: (id: number) => Promise<Subtask>;
    delete: (id: number) => Promise<void>;
    reorder: (taskId: number, subtaskIds: number[]) => Promise<void>;
  };
  reminders: {
    getAll: () => Promise<Reminder[]>;
    getByTask: (taskId: number) => Promise<Reminder[]>;
    create: (input: CreateReminderInput) => Promise<Reminder>;
    delete: (id: number) => Promise<void>;
    getUpcoming: (minutes?: number) => Promise<Reminder[]>;
  };
  ideas: {
    getAll: () => Promise<Idea[]>;
    create: (input: CreateIdeaInput) => Promise<Idea>;
    update: (id: number, input: Partial<CreateIdeaInput>) => Promise<Idea>;
    delete: (id: number) => Promise<void>;
    convertToTask: (id: number, categoryId?: number) => Promise<Task>;
  };
  categories: {
    getAll: () => Promise<Category[]>;
    create: (input: CreateCategoryInput) => Promise<Category>;
    delete: (id: number) => Promise<void>;
  };
  pomodoro: {
    save: (session: Omit<PomodoroSession, 'id' | 'completed_at' | 'task_title'>) => Promise<PomodoroSession>;
    getToday: () => Promise<PomodoroSession[]>;
    getStats: () => Promise<ProductivityStats>;
  };
  theme: {
    get: () => Promise<'light' | 'dark'>;
    set: (theme: 'light' | 'dark') => Promise<void>;
  };
  app: {
    getAutoStart: () => Promise<boolean>;
    setAutoStart: (enabled: boolean) => Promise<void>;
    getDnd: () => Promise<boolean>;
    setDnd: (enabled: boolean) => Promise<void>;
  };
  search: {
    global: (query: string) => Promise<SearchResults>;
  };
}
