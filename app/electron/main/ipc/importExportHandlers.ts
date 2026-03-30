import { ipcMain, dialog } from 'electron';
import fs from 'node:fs';
import { Channels } from '../../../shared/contracts/channels';
import type { AppDatabase } from '../../../backend/db/index';
import { importContentPack } from '../../../backend/import/contentPackImporter';
import { importLesson } from '../../../backend/import/lessonImporter';
import { exportCourse, exportLesson } from '../../../backend/export/contentPackExporter';

export function registerImportExportHandlers(db: AppDatabase) {
  ipcMain.handle(Channels.IMPORT_CONTENT_PACK, async () => {
    const result = await dialog.showOpenDialog({
      title: 'Import Content Pack',
      filters: [{ name: 'JSON Content Pack', extensions: ['json'] }],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, errors: ['Import cancelled'], counts: null };
    }

    const filePath = result.filePaths[0];
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      return importContentPack(db, data);
    } catch (err: any) {
      return {
        success: false,
        errors: [`Failed to read file: ${err.message}`],
        counts: null,
      };
    }
  });

  ipcMain.handle(
    Channels.IMPORT_LESSON,
    async (_event, data: { moduleId: string }) => {
      const result = await dialog.showOpenDialog({
        title: 'Import Lesson',
        filters: [{ name: 'JSON Lesson Pack', extensions: ['json'] }],
        properties: ['openFile'],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, errors: ['Import cancelled'], lessonId: null };
      }

      try {
        const raw = fs.readFileSync(result.filePaths[0], 'utf-8');
        const parsed = JSON.parse(raw);
        return importLesson(db, parsed, data.moduleId);
      } catch (err: any) {
        return {
          success: false,
          errors: [`Failed to read file: ${err.message}`],
          lessonId: null,
        };
      }
    },
  );

  ipcMain.handle(
    Channels.EXPORT_CONTENT_PACK,
    async (_event, data: { type: 'course' | 'lesson'; id: string }) => {
      const pack =
        data.type === 'course'
          ? exportCourse(db, data.id)
          : exportLesson(db, data.id);

      if (!pack) {
        return { success: false, error: 'Content not found' };
      }

      const result = await dialog.showSaveDialog({
        title: 'Export Content Pack',
        defaultPath: `${pack.manifest.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`,
        filters: [{ name: 'JSON Content Pack', extensions: ['json'] }],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Export cancelled' };
      }

      try {
        fs.writeFileSync(result.filePath, JSON.stringify(pack, null, 2), 'utf-8');
        return { success: true, filePath: result.filePath };
      } catch (err: any) {
        return { success: false, error: `Failed to write file: ${err.message}` };
      }
    },
  );
}
