# PRD v4.3 — Architect Review (Follow-up)

v4.3 resolves the majority of original v4 concerns — scoring weights, `mix()` definition, adaptation thresholds, cold start, fallback logic, and session lifecycle are now concrete.

**Remaining questions:**

## 1. `recencyPenalty` Breaks the [0,1] Normalization (§3.3)

The formula is `-exp(-secondsSinceSeen / 600)`, which produces values in **[-1, 0]**, not [0, 1]. This means the final score can go negative, breaking the "all scores normalized to [0,1]" claim in §2. Should this be `1 - exp(...)` instead (yielding [0,1] where recently-seen items score low)?

## 2. "New Content" Is Still a Category Confusion (§4.5, §5)

"New" appears as both:
- A **type** in soft balancing (15% quota alongside vocab/conjugation/sentence)
- A **typeBoost** value (0.05 in §3.4)

But "new" isn't a content type — it's a **state**. A new item is also a vocabulary item or a conjugation. Does a new vocabulary item count toward the 40% vocab quota AND the 15% new quota? How do you avoid double-counting?

## 3. New Content Introduction Order Still Undefined (§4.1)

How are "eligible new items" selected from the pool? Is there a lesson progression (lesson 1 first, then lesson 2), or does the engine pick freely across all lessons? This matters because v4 §2 requires vocabulary to be "thematically grouped" — free-picking across lessons would break thematic coherence.

## 4. Cold Start Session Counting (§7)

"Sessions 1–3", "Sessions 4–10" — counted per course? Per user? What if a user starts a second course — do they get cold start again? What if sessions are abandoned — do they count?

## 5. Vocabulary Normalization Still Incomplete (§10)

Still defined as `lowercase(trim(word))` — punctuation removal from v4.2 was dropped. And the Dutch-specific edge cases remain unaddressed:
- Are "huis" and "het huis" the same word?
- Are "werk" and "werken" duplicates?

A simple clarification like "words are stored as dictionary headwords without articles" would suffice.

## 6. Abandoned Session Behavior (§8)

"Persist per item" and "complete when N items answered" — but what if the user closes the app at item 12/20? Is the session resumable? Or is it marked incomplete and a new session starts next time? Do the 12 answered items still count for review scheduling?

## 7. Adaptation State Persistence (§6)

The adaptation rules reference "last 10 items" and "3 consecutive errors" — is this window scoped to the current session, or global across sessions? If I end a session after 2 consecutive errors and start a new one with 1 error, is that 3 consecutive?

---

**Priority:** #1 (recencyPenalty sign bug) is likely a formula error and should be fixed before implementation. #3 (new content ordering) affects the entire content progression model. The rest are edge cases that could be resolved during development.
