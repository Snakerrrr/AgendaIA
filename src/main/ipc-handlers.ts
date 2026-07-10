import { ipcMain } from 'electron';
import * as db from './database';
import type { TaskStatus, Priority, Urgency } from '../shared/types';

export function registerIpcHandlers(): void {
  ipcMain.handle('tasks:getAll', (_e, filter?: { status?: TaskStatus; priority?: Priority; category_id?: number; urgency?: Urgency }) => db.getAllTasks(filter));
  ipcMain.handle('tasks:getById', (_e, id: number) => db.getTaskById(id));
  ipcMain.handle('tasks:create', (_e, input) => db.createTask(input));
  ipcMain.handle('tasks:update', (_e, input) => db.updateTask(input));
  ipcMain.handle('tasks:delete', (_e, id: number) => { db.deleteTask(id); });
  ipcMain.handle('tasks:getByDate', (_e, date: string) => db.getTasksByDate(date));
  ipcMain.handle('tasks:getDashboardStats', () => db.getDashboardStats());
  ipcMain.handle('tasks:getFocusTasks', () => db.getFocusTasks());
  ipcMain.handle('tasks:setFocus', (_e, id: number, isFocus: boolean) => { db.setFocus(id, isFocus); });
  ipcMain.handle('tasks:generateRecurring', () => { db.generateRecurringTasks(); });

  ipcMain.handle('subtasks:getByTask', (_e, taskId: number) => db.getSubtasksByTask(taskId));
  ipcMain.handle('subtasks:create', (_e, input) => db.createSubtask(input));
  ipcMain.handle('subtasks:toggle', (_e, id: number) => db.toggleSubtask(id));
  ipcMain.handle('subtasks:delete', (_e, id: number) => { db.deleteSubtask(id); });
  ipcMain.handle('subtasks:reorder', (_e, taskId: number, ids: number[]) => { db.reorderSubtasks(taskId, ids); });

  ipcMain.handle('reminders:getAll', () => db.getAllReminders());
  ipcMain.handle('reminders:getByTask', (_e, taskId: number) => db.getRemindersByTask(taskId));
  ipcMain.handle('reminders:create', (_e, input) => db.createReminder(input));
  ipcMain.handle('reminders:delete', (_e, id: number) => { db.deleteReminder(id); });
  ipcMain.handle('reminders:getUpcoming', (_e, minutes?: number) => db.getUpcomingReminders(minutes));

  ipcMain.handle('ideas:getAll', () => db.getAllIdeas());
  ipcMain.handle('ideas:create', (_e, input) => db.createIdea(input));
  ipcMain.handle('ideas:update', (_e, id: number, input) => db.updateIdea(id, input));
  ipcMain.handle('ideas:delete', (_e, id: number) => { db.deleteIdea(id); });
  ipcMain.handle('ideas:convertToTask', (_e, id: number, categoryId?: number) => db.convertIdeaToTask(id, categoryId));

  ipcMain.handle('categories:getAll', () => db.getAllCategories());
  ipcMain.handle('categories:create', (_e, input) => db.createCategory(input));
  ipcMain.handle('categories:delete', (_e, id: number) => { db.deleteCategory(id); });

  ipcMain.handle('pomodoro:save', (_e, session) => db.savePomodoroSession(session));
  ipcMain.handle('pomodoro:getToday', () => db.getTodayPomodoros());
  ipcMain.handle('pomodoro:getStats', () => db.getProductivityStats());

  ipcMain.handle('theme:get', () => db.getSetting('theme') ?? 'dark');
  ipcMain.handle('theme:set', (_e, theme: 'light' | 'dark') => { db.setSetting('theme', theme); });

  ipcMain.handle('search:global', (_e, query: string) => db.globalSearch(query));
}
