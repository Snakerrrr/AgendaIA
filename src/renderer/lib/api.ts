import type { IpcApi } from '../../shared/types';

declare global {
  interface Window {
    api: IpcApi;
  }
}

export const api = window.api;
