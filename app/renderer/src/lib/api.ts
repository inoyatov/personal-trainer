import type { ElectronAPI } from '../../../electron/preload/preload';

declare global {
  interface Window {
    api: ElectronAPI;
  }
}

export const api = window.api;
