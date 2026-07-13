import initSqlJs, { type Database } from 'sql.js';
import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import { addDays, addWeeks, addMonths, format } from 'date-fns';
import type {
  Task, Subtask, Reminder, Idea, Category,
  PomodoroSession, DashboardStats, ProductivityStats,
  CreateTaskInput, UpdateTaskInput, CreateReminderInput,
  CreateIdeaInput, CreateCategoryInput, CreateSubtaskInput,
  TaskStatus, Priority, Urgency,
} from '../shared/types';

let db: Database;
let dbPath: string;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const data = db.export();
      fs.writeFileSync(dbPath, Buffer.from(data));
    } catch { /* silent */ }
  }, 500);
}

function saveNow(): void {
  if (saveTimer) clearTimeout(saveTimer);
  try {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  } catch { /* silent */ }
}

export async function initDatabase(): Promise<void> {
  const wasmPath = app.isPackaged
    ? path.join(process.resourcesPath, 'sql-wasm.wasm')
    : path.join(app.getAppPath(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');

  const SQL = await initSqlJs({ locateFile: () => wasmPath });
  dbPath = path.join(app.getPath('userData'), 'agendaia.db');

  if (fs.existsSync(dbPath)) {
    db = new SQL.Database(fs.readFileSync(dbPath));
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');
  migrate();
  seedDefaultCategories();
  saveNow();
}

function migrate(): void {
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3b82f6',
    icon TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK(priority IN ('low','medium','high')) DEFAULT 'medium',
    urgency TEXT CHECK(urgency IN ('not_urgent','urgent')) DEFAULT 'not_urgent',
    status TEXT CHECK(status IN ('pending','in_progress','completed','cancelled')) DEFAULT 'pending',
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    due_date TEXT,
    is_recurring INTEGER DEFAULT 0,
    recurrence_type TEXT,
    recurrence_interval INTEGER DEFAULT 1,
    recurrence_end_date TEXT,
    is_focus INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS subtasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    remind_at TEXT NOT NULL,
    is_sent INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    is_converted INTEGER DEFAULT 0,
    task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 25,
    type TEXT CHECK(type IN ('focus','short_break','long_break')) DEFAULT 'focus',
    completed_at TEXT DEFAULT (datetime('now','localtime'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`);

  // v2 migration: add new columns to existing tables
  const cols = queryAll("PRAGMA table_info(tasks)").map((r) => r.name as string);
  if (!cols.includes('urgency')) {
    db.run("ALTER TABLE tasks ADD COLUMN urgency TEXT DEFAULT 'not_urgent'");
  }
  if (!cols.includes('is_recurring')) {
    db.run("ALTER TABLE tasks ADD COLUMN is_recurring INTEGER DEFAULT 0");
    db.run("ALTER TABLE tasks ADD COLUMN recurrence_type TEXT");
    db.run("ALTER TABLE tasks ADD COLUMN recurrence_interval INTEGER DEFAULT 1");
    db.run("ALTER TABLE tasks ADD COLUMN recurrence_end_date TEXT");
  }
  if (!cols.includes('is_focus')) {
    db.run("ALTER TABLE tasks ADD COLUMN is_focus INTEGER DEFAULT 0");
  }
  if (!cols.includes('recurring_parent_id')) {
    db.run("ALTER TABLE tasks ADD COLUMN recurring_parent_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL");
  }

  // Always clean up: ensure only one template per title, rest become instances
  const dupes = queryAll(`
    SELECT title, MIN(id) as template_id, COUNT(*) as cnt
    FROM tasks WHERE is_recurring = 1 AND recurring_parent_id IS NULL
    GROUP BY title HAVING cnt > 1
  `);
  for (const d of dupes) {
    db.run("UPDATE tasks SET is_recurring = 0, recurring_parent_id = ? WHERE title = ? AND id != ? AND is_recurring = 1",
      [d.template_id, d.title, d.template_id]);
  }
}

function seedDefaultCategories(): void {
  const result = db.exec('SELECT COUNT(*) as c FROM categories');
  const count = result[0]?.values[0]?.[0] as number;
  if (count === 0) {
    const defaults = [
      ['Personal', '#3b82f6', 'user'],
      ['Trabajo', '#ef4444', 'briefcase'],
      ['Salud', '#22c55e', 'heart'],
      ['Estudio', '#a855f7', 'book-open'],
      ['Hogar', '#f59e0b', 'home'],
    ];
    for (const [name, color, icon] of defaults) {
      db.run('INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)', [name, color, icon]);
    }
  }
}

type Row = Record<string, unknown>;

function queryAll(sql: string, params: unknown[] = []): Row[] {
  const stmt = db.prepare(sql);
  stmt.bind(params.length > 0 ? params : undefined);
  const rows: Row[] = [];
  while (stmt.step()) rows.push(stmt.getAsObject() as Row);
  stmt.free();
  return rows;
}

function queryOne(sql: string, params: unknown[] = []): Row | null {
  return queryAll(sql, params)[0] ?? null;
}

function runSql(sql: string, params: unknown[] = []): number {
  db.run(sql, params);
  const result = db.exec('SELECT last_insert_rowid() as id');
  scheduleSave();
  return (result[0]?.values[0]?.[0] as number) ?? 0;
}

// ── Tasks ──

export function getAllTasks(filter?: { status?: TaskStatus; priority?: Priority; category_id?: number; urgency?: Urgency }): Task[] {
  let sql = `SELECT t.*, c.name as category_name, c.color as category_color
    FROM tasks t LEFT JOIN categories c ON t.category_id = c.id WHERE 1=1`;
  const params: unknown[] = [];

  if (filter?.status) { sql += ' AND t.status = ?'; params.push(filter.status); }
  if (filter?.priority) { sql += ' AND t.priority = ?'; params.push(filter.priority); }
  if (filter?.category_id) { sql += ' AND t.category_id = ?'; params.push(filter.category_id); }
  if (filter?.urgency) { sql += ' AND t.urgency = ?'; params.push(filter.urgency); }

  sql += " ORDER BY CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, t.created_at DESC";
  return queryAll(sql, params) as unknown as Task[];
}

export function getTaskById(id: number): Task | null {
  return queryOne(`SELECT t.*, c.name as category_name, c.color as category_color
    FROM tasks t LEFT JOIN categories c ON t.category_id = c.id WHERE t.id = ?`, [id]) as unknown as Task | null;
}

export function createTask(input: CreateTaskInput): Task {
  const lastId = runSql(`INSERT INTO tasks (title, description, priority, urgency, status, category_id, due_date, is_recurring, recurrence_type, recurrence_interval, recurrence_end_date, is_focus)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    input.title, input.description ?? null, input.priority ?? 'medium',
    input.urgency ?? 'not_urgent', input.status ?? 'pending',
    input.category_id ?? null, input.due_date ?? null,
    input.is_recurring ? 1 : 0, input.recurrence_type ?? null,
    input.recurrence_interval ?? 1, input.recurrence_end_date ?? null,
    input.is_focus ? 1 : 0,
  ]);
  return getTaskById(lastId)!;
}

export function updateTask(input: UpdateTaskInput): Task {
  const e = getTaskById(input.id);
  if (!e) throw new Error(`Task ${input.id} not found`);

  runSql(`UPDATE tasks SET title=?, description=?, priority=?, urgency=?, status=?,
    category_id=?, due_date=?, is_recurring=?, recurrence_type=?, recurrence_interval=?,
    recurrence_end_date=?, is_focus=?, updated_at=datetime('now','localtime') WHERE id=?`, [
    input.title ?? e.title,
    input.description !== undefined ? input.description : e.description,
    input.priority ?? e.priority,
    input.urgency ?? e.urgency,
    input.status ?? e.status,
    input.category_id !== undefined ? input.category_id : e.category_id,
    input.due_date !== undefined ? input.due_date : e.due_date,
    input.is_recurring !== undefined ? (input.is_recurring ? 1 : 0) : e.is_recurring,
    input.recurrence_type !== undefined ? input.recurrence_type : e.recurrence_type,
    input.recurrence_interval !== undefined ? input.recurrence_interval : e.recurrence_interval,
    input.recurrence_end_date !== undefined ? input.recurrence_end_date : e.recurrence_end_date,
    input.is_focus !== undefined ? (input.is_focus ? 1 : 0) : e.is_focus,
    input.id,
  ]);
  return getTaskById(input.id)!;
}

export function deleteTask(id: number): void { runSql('DELETE FROM tasks WHERE id = ?', [id]); }

export function getTasksByDate(date: string): Task[] {
  return queryAll(`SELECT t.*, c.name as category_name, c.color as category_color
    FROM tasks t LEFT JOIN categories c ON t.category_id = c.id
    WHERE date(t.due_date) = date(?)
    ORDER BY CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END`, [date]) as unknown as Task[];
}

export function getFocusTasks(): Task[] {
  return queryAll(`SELECT t.*, c.name as category_name, c.color as category_color
    FROM tasks t LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.is_focus = 1 AND t.status NOT IN ('completed','cancelled')
    ORDER BY CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END`) as unknown as Task[];
}

export function setFocus(id: number, isFocus: boolean): void {
  if (isFocus) {
    const current = queryAll("SELECT COUNT(*) as c FROM tasks WHERE is_focus = 1 AND status NOT IN ('completed','cancelled')");
    if ((current[0]?.c as number) >= 3) throw new Error('Máximo 3 tareas en foco');
  }
  runSql('UPDATE tasks SET is_focus = ? WHERE id = ?', [isFocus ? 1 : 0, id]);
}

export function generateRecurringTasks(): void {
  const today = format(new Date(), 'yyyy-MM-dd');
  const now = new Date();

  // Only find TEMPLATE tasks (is_recurring=1 AND NOT a generated instance)
  const templates = queryAll(`
    SELECT * FROM tasks
    WHERE is_recurring = 1 AND recurrence_type IS NOT NULL AND recurring_parent_id IS NULL
  `) as unknown as (Task & { recurring_parent_id: number | null })[];

  for (const tmpl of templates) {
    if (tmpl.recurrence_end_date && new Date(tmpl.recurrence_end_date) < now) continue;

    const interval = tmpl.recurrence_interval ?? 1;
    const baseDate = tmpl.due_date ? new Date(tmpl.due_date) : new Date(tmpl.created_at);

    let shouldCreate = false;
    const daysDiff = Math.floor((now.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));

    switch (tmpl.recurrence_type) {
      case 'daily':
        shouldCreate = daysDiff >= 0 && (interval === 1 || daysDiff % interval === 0);
        break;
      case 'weekly':
        shouldCreate = daysDiff >= 0 && now.getDay() === baseDate.getDay();
        break;
      case 'monthly':
        shouldCreate = daysDiff >= 0 && now.getDate() === baseDate.getDate();
        break;
    }

    if (!shouldCreate) continue;

    // Skip if any task with same title already exists for today (by parent or by name)
    const exists = queryOne(
      "SELECT id FROM tasks WHERE (recurring_parent_id = ? OR (title = ? AND id != ?)) AND date(due_date) = date(?)",
      [tmpl.id, tmpl.title, tmpl.id, today]
    );
    if (exists) continue;

    // Skip if template itself is for today
    if (tmpl.due_date && format(new Date(tmpl.due_date), 'yyyy-MM-dd') === today) continue;

    const hour = baseDate.getHours() || 9;
    const minute = baseDate.getMinutes() || 0;
    const todayDate = `${today}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    // Create instance (NOT recurring itself, linked to parent)
    const lastId = runSql(`INSERT INTO tasks (title, description, priority, urgency, status, category_id, due_date, is_recurring, recurring_parent_id)
      VALUES (?, ?, ?, ?, 'pending', ?, ?, 0, ?)`, [
      tmpl.title, tmpl.description, tmpl.priority, tmpl.urgency,
      tmpl.category_id, todayDate, tmpl.id,
    ]);
  }
}

export function getRecurringTemplates(): Task[] {
  return queryAll(`SELECT t.*, c.name as category_name, c.color as category_color
    FROM tasks t LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.is_recurring = 1 AND t.recurring_parent_id IS NULL
    ORDER BY t.title ASC`) as unknown as Task[];
}

export function toggleRecurring(id: number, enable: boolean): void {
  if (enable) {
    runSql("UPDATE tasks SET is_recurring = 1, recurrence_type = 'daily', recurrence_interval = 1, recurring_parent_id = NULL WHERE id = ?", [id]);
  } else {
    // Disable: mark as normal task, remove from future generation
    runSql("UPDATE tasks SET is_recurring = 0, recurrence_type = NULL, recurrence_interval = NULL, recurring_parent_id = NULL WHERE id = ?", [id]);
  }
}

export function getDashboardStats(): DashboardStats {
  const today = new Date().toISOString().split('T')[0];
  const r = queryOne(`SELECT COUNT(*) as totalToday,
    SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN status='in_progress' THEN 1 ELSE 0 END) as inProgress,
    SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed
    FROM tasks WHERE date(due_date) = date(?)`, [today]) as Record<string, number> | null;
  const o = queryOne("SELECT COUNT(*) as c FROM tasks WHERE date(due_date) < date(?) AND status NOT IN ('completed','cancelled')", [today]) as { c: number } | null;

  return {
    totalToday: r?.totalToday || 0, pending: r?.pending || 0,
    inProgress: r?.inProgress || 0, completed: r?.completed || 0,
    overdue: (o?.c as number) || 0,
  };
}

// ── Subtasks ──

export function getSubtasksByTask(taskId: number): Subtask[] {
  return queryAll('SELECT * FROM subtasks WHERE task_id = ? ORDER BY sort_order ASC', [taskId]) as unknown as Subtask[];
}

export function createSubtask(input: CreateSubtaskInput): Subtask {
  const maxOrder = queryOne('SELECT MAX(sort_order) as m FROM subtasks WHERE task_id = ?', [input.task_id]) as { m: number } | null;
  const lastId = runSql('INSERT INTO subtasks (task_id, title, sort_order) VALUES (?, ?, ?)',
    [input.task_id, input.title, (maxOrder?.m ?? -1) + 1]);
  return queryOne('SELECT * FROM subtasks WHERE id = ?', [lastId]) as unknown as Subtask;
}

export function toggleSubtask(id: number): Subtask {
  runSql('UPDATE subtasks SET is_completed = CASE WHEN is_completed = 1 THEN 0 ELSE 1 END WHERE id = ?', [id]);
  return queryOne('SELECT * FROM subtasks WHERE id = ?', [id]) as unknown as Subtask;
}

export function deleteSubtask(id: number): void { runSql('DELETE FROM subtasks WHERE id = ?', [id]); }

export function reorderSubtasks(taskId: number, subtaskIds: number[]): void {
  subtaskIds.forEach((id, idx) => { runSql('UPDATE subtasks SET sort_order = ? WHERE id = ? AND task_id = ?', [idx, id, taskId]); });
}

// ── Reminders ──

export function getAllReminders(): Reminder[] {
  return queryAll(`SELECT r.*, t.title as task_title FROM reminders r JOIN tasks t ON r.task_id = t.id ORDER BY r.remind_at ASC`) as unknown as Reminder[];
}
export function getRemindersByTask(taskId: number): Reminder[] {
  return queryAll(`SELECT r.*, t.title as task_title FROM reminders r JOIN tasks t ON r.task_id = t.id WHERE r.task_id = ? ORDER BY r.remind_at ASC`, [taskId]) as unknown as Reminder[];
}
export function createReminder(input: CreateReminderInput): Reminder {
  const lastId = runSql('INSERT INTO reminders (task_id, remind_at) VALUES (?, ?)', [input.task_id, input.remind_at]);
  return queryAll(`SELECT r.*, t.title as task_title FROM reminders r JOIN tasks t ON r.task_id = t.id WHERE r.id = ?`, [lastId])[0] as unknown as Reminder;
}
export function deleteReminder(id: number): void { runSql('DELETE FROM reminders WHERE id = ?', [id]); }
export function getUpcomingReminders(minutes = 5): Reminder[] {
  return queryAll(`SELECT r.*, t.title as task_title FROM reminders r JOIN tasks t ON r.task_id = t.id
    WHERE r.is_sent = 0 AND datetime(r.remind_at) <= datetime('now','localtime','+' || ? || ' minutes')
    AND datetime(r.remind_at) >= datetime('now','localtime','-1 minutes') ORDER BY r.remind_at ASC`, [minutes]) as unknown as Reminder[];
}
export function markReminderSent(id: number): void { runSql('UPDATE reminders SET is_sent = 1 WHERE id = ?', [id]); }

// ── Ideas ──

export function getAllIdeas(): Idea[] { return queryAll('SELECT * FROM ideas ORDER BY created_at DESC') as unknown as Idea[]; }
export function createIdea(input: CreateIdeaInput): Idea {
  const lastId = runSql('INSERT INTO ideas (title, content) VALUES (?, ?)', [input.title, input.content ?? null]);
  return queryOne('SELECT * FROM ideas WHERE id = ?', [lastId]) as unknown as Idea;
}
export function updateIdea(id: number, input: Partial<CreateIdeaInput>): Idea {
  const e = queryOne('SELECT * FROM ideas WHERE id = ?', [id]) as unknown as Idea;
  if (!e) throw new Error(`Idea ${id} not found`);
  runSql('UPDATE ideas SET title = ?, content = ? WHERE id = ?', [input.title ?? e.title, input.content !== undefined ? input.content : e.content, id]);
  return queryOne('SELECT * FROM ideas WHERE id = ?', [id]) as unknown as Idea;
}
export function deleteIdea(id: number): void { runSql('DELETE FROM ideas WHERE id = ?', [id]); }
export function convertIdeaToTask(id: number, categoryId?: number): Task {
  const idea = queryOne('SELECT * FROM ideas WHERE id = ?', [id]) as unknown as Idea;
  if (!idea) throw new Error(`Idea ${id} not found`);
  const task = createTask({ title: idea.title, description: idea.content ?? undefined, category_id: categoryId ?? null });
  runSql('UPDATE ideas SET is_converted = 1, task_id = ? WHERE id = ?', [task.id, id]);
  return task;
}

// ── Categories ──

export function getAllCategories(): Category[] { return queryAll('SELECT * FROM categories ORDER BY name ASC') as unknown as Category[]; }
export function createCategory(input: CreateCategoryInput): Category {
  const lastId = runSql('INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)', [input.name, input.color ?? '#3b82f6', input.icon ?? null]);
  return queryOne('SELECT * FROM categories WHERE id = ?', [lastId]) as unknown as Category;
}
export function deleteCategory(id: number): void { runSql('DELETE FROM categories WHERE id = ?', [id]); }

// ── Pomodoro ──

export function savePomodoroSession(session: { task_id: number | null; duration_minutes: number; type: 'focus' | 'short_break' | 'long_break' }): PomodoroSession {
  const lastId = runSql('INSERT INTO pomodoro_sessions (task_id, duration_minutes, type) VALUES (?, ?, ?)',
    [session.task_id, session.duration_minutes, session.type]);
  return queryOne(`SELECT p.*, t.title as task_title FROM pomodoro_sessions p LEFT JOIN tasks t ON p.task_id = t.id WHERE p.id = ?`, [lastId]) as unknown as PomodoroSession;
}

export function getTodayPomodoros(): PomodoroSession[] {
  const today = new Date().toISOString().split('T')[0];
  return queryAll(`SELECT p.*, t.title as task_title FROM pomodoro_sessions p LEFT JOIN tasks t ON p.task_id = t.id
    WHERE date(p.completed_at) = date(?) AND p.type = 'focus' ORDER BY p.completed_at DESC`, [today]) as unknown as PomodoroSession[];
}

export function getProductivityStats(): ProductivityStats {
  const today = new Date().toISOString().split('T')[0];

  const thisWeek = (queryOne("SELECT COUNT(*) as c FROM tasks WHERE status='completed' AND date(updated_at) >= date(?,'weekday 0','-6 days')", [today]) as { c: number })?.c || 0;
  const lastWeek = (queryOne("SELECT COUNT(*) as c FROM tasks WHERE status='completed' AND date(updated_at) >= date(?,'weekday 0','-13 days') AND date(updated_at) < date(?,'weekday 0','-6 days')", [today, today]) as { c: number })?.c || 0;

  const dailyRows = queryAll("SELECT date(updated_at) as date, COUNT(*) as count FROM tasks WHERE status='completed' AND date(updated_at) >= date(?,-29) GROUP BY date(updated_at) ORDER BY date ASC", [today + '']) as unknown as { date: string; count: number }[];

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  const dateSet = new Set(dailyRows.map((r) => r.date));
  for (let i = 0; i < 365; i++) {
    const d = format(addDays(new Date(), -i), 'yyyy-MM-dd');
    if (dateSet.has(d)) {
      tempStreak++;
      if (i <= currentStreak) currentStreak = tempStreak;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      if (i > 0) break;
      tempStreak = 0;
    }
  }

  const pomToday = (queryOne("SELECT COUNT(*) as c FROM pomodoro_sessions WHERE date(completed_at)=date(?) AND type='focus'", [today]) as { c: number })?.c || 0;
  const pomWeek = (queryOne("SELECT COUNT(*) as c FROM pomodoro_sessions WHERE date(completed_at)>=date(?,'weekday 0','-6 days') AND type='focus'", [today]) as { c: number })?.c || 0;

  const byCat = queryAll(`SELECT c.name, c.color, COUNT(*) as count FROM tasks t JOIN categories c ON t.category_id = c.id
    WHERE t.status='completed' GROUP BY c.id ORDER BY count DESC`) as unknown as { name: string; color: string; count: number }[];

  return {
    tasksCompletedThisWeek: thisWeek,
    tasksCompletedLastWeek: lastWeek,
    currentStreak, bestStreak,
    pomodorosToday: pomToday,
    pomodorosThisWeek: pomWeek,
    completionByCategory: byCat,
    dailyCompletions: dailyRows,
  };
}

// ── Settings ──

export function getSetting(key: string): string | null {
  const row = queryOne('SELECT value FROM settings WHERE key = ?', [key]) as { value: string } | null;
  return row?.value ?? null;
}
export function setSetting(key: string, value: string): void { runSql('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]); }
export function closeDatabase(): void { if (db) { saveNow(); db.close(); } }

// ── Search ──

export function globalSearch(query: string) {
  const q = `%${query}%`;
  const tasks = queryAll(`SELECT t.*, c.name as category_name, c.color as category_color
    FROM tasks t LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.title LIKE ? OR t.description LIKE ? ORDER BY t.updated_at DESC LIMIT 20`, [q, q]) as unknown as Task[];
  const ideas = queryAll("SELECT * FROM ideas WHERE title LIKE ? OR content LIKE ? ORDER BY created_at DESC LIMIT 10", [q, q]) as unknown as Idea[];
  const reminders = queryAll(`SELECT r.*, t.title as task_title FROM reminders r JOIN tasks t ON r.task_id = t.id
    WHERE t.title LIKE ? ORDER BY r.remind_at DESC LIMIT 10`, [q]) as unknown as Reminder[];
  return { tasks, ideas, reminders };
}
