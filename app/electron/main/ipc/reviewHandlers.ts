import { ipcMain } from 'electron';
import { Channels } from '../../../shared/contracts/channels';
import {
  getDueItemsRequest,
  getReviewStateRequest,
  updateReviewStateRequest,
  getAllReviewStatesRequest,
} from '../../../shared/contracts/schemas';
import type { ReviewRepository } from '../../../backend/db/repositories/reviewRepository';
import type { ContentRepository } from '../../../backend/db/repositories/contentRepository';

export function registerReviewHandlers(
  reviewRepo: ReviewRepository,
  contentRepo: ContentRepository,
) {
  ipcMain.handle(Channels.REVIEW_GET_DUE_ITEMS, (_event, data: unknown) => {
    const { userId } = getDueItemsRequest.parse(data ?? {});
    return reviewRepo.getDueItems(userId);
  });

  ipcMain.handle(Channels.REVIEW_GET_STATE, (_event, data: unknown) => {
    const { userId, entityType, entityId } =
      getReviewStateRequest.parse(data);
    return reviewRepo.getReviewState(userId, entityType, entityId);
  });

  ipcMain.handle(Channels.REVIEW_UPDATE_STATE, (_event, data: unknown) => {
    const parsed = updateReviewStateRequest.parse(data);
    return reviewRepo.upsertReviewState(parsed);
  });

  ipcMain.handle(
    Channels.REVIEW_GET_ALL_STATES,
    (_event, data: unknown) => {
      const { userId } = getAllReviewStatesRequest.parse(data ?? {});
      return reviewRepo.getAllReviewStates(userId);
    },
  );

  ipcMain.handle(Channels.REVIEW_GET_EXERCISES, (_event, data: unknown) => {
    const { userId } = getDueItemsRequest.parse(data ?? {});
    const dueItems = reviewRepo.getDueItems(userId);

    const sentences: any[] = [];
    const seenIds = new Set<string>();

    for (const item of dueItems) {
      if (seenIds.has(item.entityId)) continue;
      seenIds.add(item.entityId);

      const sentence = contentRepo.getSentenceById(item.entityId);
      if (sentence) {
        sentences.push(sentence);
      }
    }

    return { sentences, dueItemCount: dueItems.length };
  });
}
