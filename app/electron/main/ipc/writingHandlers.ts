import { ipcMain } from 'electron';
import { Channels } from '../../../shared/contracts/channels';
import {
  getWritingPromptsRequest,
  getWritingPromptRequest,
  submitWritingRequest,
  getWritingSubmissionsRequest,
  getLessonProgressRequest,
  getAllProgressRequest,
  updateLessonProgressRequest,
} from '../../../shared/contracts/schemas';
import type { WritingRepository } from '../../../backend/db/repositories/writingRepository';

export function registerWritingHandlers(writingRepo: WritingRepository) {
  ipcMain.handle(Channels.WRITING_GET_PROMPTS, (_event, data: unknown) => {
    const { lessonId } = getWritingPromptsRequest.parse(data);
    return writingRepo.getPromptsByLesson(lessonId);
  });

  ipcMain.handle(Channels.WRITING_GET_PROMPT, (_event, data: unknown) => {
    const { promptId } = getWritingPromptRequest.parse(data);
    return writingRepo.getPromptById(promptId);
  });

  ipcMain.handle(Channels.WRITING_SUBMIT, (_event, data: unknown) => {
    const parsed = submitWritingRequest.parse(data);
    return writingRepo.insertSubmission(parsed);
  });

  ipcMain.handle(
    Channels.WRITING_GET_SUBMISSIONS,
    (_event, data: unknown) => {
      const { userId } = getWritingSubmissionsRequest.parse(data ?? {});
      return writingRepo.getSubmissionsByUser(userId);
    },
  );

  ipcMain.handle(Channels.PROGRESS_GET_LESSON, (_event, data: unknown) => {
    const { userId, lessonId } = getLessonProgressRequest.parse(data);
    return writingRepo.getLessonProgress(userId, lessonId);
  });

  ipcMain.handle(Channels.PROGRESS_GET_ALL, (_event, data: unknown) => {
    const { userId } = getAllProgressRequest.parse(data ?? {});
    return writingRepo.getAllLessonProgress(userId);
  });

  ipcMain.handle(
    Channels.PROGRESS_UPDATE_LESSON,
    (_event, data: unknown) => {
      const parsed = updateLessonProgressRequest.parse(data);
      return writingRepo.upsertLessonProgress(parsed);
    },
  );
}
