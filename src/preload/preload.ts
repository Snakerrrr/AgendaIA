import { contextBridge, ipcRenderer } from 'electron';
import type { IpcApi } from '../shared/types';

const api: IpcApi = {
  tasks: {
    getAll: (filter) => ipcRenderer.invoke('tasks:getAll', filter),
    getById: (id) => ipcRenderer.invoke('tasks:getById', id),
    create: (input) => ipcRenderer.invoke('tasks:create', input),
    update: (input) => ipcRenderer.invoke('tasks:update', input),
    delete: (id) => ipcRenderer.invoke('tasks:delete', id),
    getByDate: (date) => ipcRenderer.invoke('tasks:getByDate', date),
    getDashboardStats: () => ipcRenderer.invoke('tasks:getDashboardStats'),
    getFocusTasks: () => ipcRenderer.invoke('tasks:getFocusTasks'),
    setFocus: (id, isFocus) => ipcRenderer.invoke('tasks:setFocus', id, isFocus),
    generateRecurring: () => ipcRenderer.invoke('tasks:generateRecurring'),
    getRecurringTemplates: () => ipcRenderer.invoke('tasks:getRecurringTemplates'),
    toggleRecurring: (id, enable) => ipcRenderer.invoke('tasks:toggleRecurring', id, enable),
  },
  subtasks: {
    getByTask: (taskId) => ipcRenderer.invoke('subtasks:getByTask', taskId),
    create: (input) => ipcRenderer.invoke('subtasks:create', input),
    toggle: (id) => ipcRenderer.invoke('subtasks:toggle', id),
    delete: (id) => ipcRenderer.invoke('subtasks:delete', id),
    reorder: (taskId, ids) => ipcRenderer.invoke('subtasks:reorder', taskId, ids),
  },
  reminders: {
    getAll: () => ipcRenderer.invoke('reminders:getAll'),
    getByTask: (taskId) => ipcRenderer.invoke('reminders:getByTask', taskId),
    create: (input) => ipcRenderer.invoke('reminders:create', input),
    delete: (id) => ipcRenderer.invoke('reminders:delete', id),
    getUpcoming: (minutes) => ipcRenderer.invoke('reminders:getUpcoming', minutes),
  },
  ideas: {
    getAll: () => ipcRenderer.invoke('ideas:getAll'),
    create: (input) => ipcRenderer.invoke('ideas:create', input),
    update: (id, input) => ipcRenderer.invoke('ideas:update', id, input),
    delete: (id) => ipcRenderer.invoke('ideas:delete', id),
    convertToTask: (id, categoryId) => ipcRenderer.invoke('ideas:convertToTask', id, categoryId),
  },
  categories: {
    getAll: () => ipcRenderer.invoke('categories:getAll'),
    create: (input) => ipcRenderer.invoke('categories:create', input),
    delete: (id) => ipcRenderer.invoke('categories:delete', id),
  },
  pomodoro: {
    save: (session) => ipcRenderer.invoke('pomodoro:save', session),
    getToday: () => ipcRenderer.invoke('pomodoro:getToday'),
    getStats: () => ipcRenderer.invoke('pomodoro:getStats'),
  },
  theme: {
    get: () => ipcRenderer.invoke('theme:get'),
    set: (theme) => ipcRenderer.invoke('theme:set', theme),
  },
  app: {
    getAutoStart: () => ipcRenderer.invoke('app:getAutoStart'),
    setAutoStart: (enabled) => ipcRenderer.invoke('app:setAutoStart', enabled),
    getDnd: () => ipcRenderer.invoke('app:getDnd'),
    setDnd: (enabled) => ipcRenderer.invoke('app:setDnd', enabled),
  },
  search: {
    global: (query) => ipcRenderer.invoke('search:global', query),
  },
};

contextBridge.exposeInMainWorld('api', api);

contextBridge.exposeInMainWorld('onQuickAdd', (callback: () => void) => {
  ipcRenderer.on('quick-add', () => callback());
});

contextBridge.exposeInMainWorld('onOpenSearch', (callback: () => void) => {
  ipcRenderer.on('open-search', () => callback());
});

contextBridge.exposeInMainWorld('electronOpenMain', () => {
  ipcRenderer.invoke('app:openMain');
});
