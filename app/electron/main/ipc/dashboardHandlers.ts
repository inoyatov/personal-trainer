import { ipcMain } from 'electron';
import { Channels } from '../../../shared/contracts/channels';
import type { DashboardService } from '../../../backend/domain/progress/dashboardService';

export function registerDashboardHandlers(dashboardService: DashboardService) {
  ipcMain.handle(Channels.DASHBOARD_GET_STATS, () => {
    return dashboardService.getStats();
  });

  ipcMain.handle(Channels.DASHBOARD_GET_RECENT_SESSIONS, () => {
    return dashboardService.getRecentSessions();
  });
}
