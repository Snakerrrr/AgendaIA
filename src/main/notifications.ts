import { Notification, BrowserWindow } from 'electron';
import { getUpcomingReminders, markReminderSent } from './database';

let intervalId: ReturnType<typeof setInterval> | null = null;
let dndEnabled = false;

export function setDoNotDisturb(enabled: boolean): void {
  dndEnabled = enabled;
}

export function startReminderService(): void {
  if (intervalId) return;
  intervalId = setInterval(() => checkReminders(), 30_000);
  checkReminders();
}

export function stopReminderService(): void {
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
}

function checkReminders(): void {
  try {
    const upcoming = getUpcomingReminders(1);
    for (const reminder of upcoming) {
      if (!dndEnabled) {
        const notification = new Notification({
          title: 'AgendaIA - Recordatorio',
          body: reminder.task_title ?? 'Tienes una tarea pendiente',
          silent: false,
        });
        notification.on('click', () => {
          const windows = BrowserWindow.getAllWindows();
          if (windows.length > 0) { const win = windows[0]; if (win.isMinimized()) win.restore(); win.focus(); }
        });
        notification.show();
      }
      markReminderSent(reminder.id);
    }
  } catch { /* silent */ }
}
