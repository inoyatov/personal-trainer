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
    const items = reviewRepo.getDueItems(userId);

    // Enrich with display labels and filter out orphans
    const enriched = [];
    for (const item of items) {
      let displayLabel: string | null = null;

      if (item.entityType === 'vocabulary') {
        const vocab = contentRepo.getVocabularyById(item.entityId);
        if (vocab) displayLabel = `${vocab.displayText} — ${vocab.translation}`;
      } else if (item.entityType === 'sentence') {
        const sentence = contentRepo.getSentenceById(item.entityId);
        if (sentence) {
          displayLabel = sentence.text.length > 50 ? sentence.text.slice(0, 47) + '...' : sentence.text;
        } else {
          const turn = contentRepo.getDialogTurnById(item.entityId);
          if (turn) displayLabel = `${turn.speaker}: ${turn.text}`;
        }
      } else if (item.entityType === 'dialog') {
        const dialog = contentRepo.getDialogById(item.entityId);
        if (dialog) displayLabel = dialog.title;
      }

      if (displayLabel) {
        enriched.push({ ...item, displayLabel });
      } else {
        // Orphaned review state — delete it
        reviewRepo.deleteReviewState(item.id);
      }
    }

    return enriched;
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

      let resolved = false;

      // Try sentence first
      const sentence = contentRepo.getSentenceById(item.entityId);
      if (sentence) {
        sentences.push(sentence);
        resolved = true;
        continue;
      }

      // Try dialog turn (legacy: stored as entityType 'sentence')
      const turn = contentRepo.getDialogTurnById(item.entityId);
      if (turn) {
        sentences.push({
          id: turn.id,
          text: turn.text,
          translation: turn.translation || turn.text,
          lessonId: '',
        });
        resolved = true;
        continue;
      }

      // Vocabulary items — create a sentence-like object from the word
      if (item.entityType === 'vocabulary') {
        const vocab = contentRepo.getVocabularyById(item.entityId);
        if (vocab) {
          sentences.push({
            id: vocab.id,
            text: vocab.displayText,
            translation: vocab.translation,
            lessonId: '',
          });
          resolved = true;
        }
      }

      // Orphan cleanup: delete review states that can't resolve to content
      if (!resolved) {
        reviewRepo.deleteReviewState(item.id);
      }
    }

    return { sentences, dueItemCount: sentences.length };
  });
}
