# PRD v4.x — Architect Review & Clarification Points

## 1. Priority Score Weights Are Undefined (v4.2 §5.2)

The scoring formula `score = w1*dueScore + w2*errorScore + w3*recencyScore + w4*typeWeight` is introduced but **w1–w4 are never specified**. Nor are the individual score functions defined — what does "higher if overdue" mean numerically? Without concrete ranges and weights, two implementers will produce two different systems. Need:
- Concrete weight values (or at least a starting baseline)
- Score normalization ranges (0–1? 0–100?)
- How `dueScore` maps from days-overdue to a number

## 2. `mix()` Function Is a Black Box (v4.1 §3.2, v4.2.1 §2–3)

`mix([dueVocabulary(0.4), dueConjugation(0.25), ...], limit)` appears repeatedly but is never specified. Critical questions:
- Are the percentages **hard quotas** or **soft targets**? What happens if there aren't enough due conjugations to fill 25%?
- Does it fill quotas first, then backfill? Or score globally and enforce quotas as a post-filter?
- v4.2 §6 type balancing percentages **conflict** with v4.2.1 §3 (new items 15% vs 20%). Which wins?

## 3. Conflict Between Deterministic Selection and Type Balancing (v4.2 §5.3 vs §6)

The session builder takes the top-N by score, but then §6 says "ensure mix" of type percentages, and §8 says "enforce type quotas after scoring." These can contradict — if the top 20 items by score are all vocabulary (e.g., after a week away), do we force-replace 12 of them with lower-scored conjugation/dialog items? This fundamentally changes the "maximum learning efficiency" principle. Need a clear algorithm: **score-first-then-constrain** vs **quota-first-then-fill-by-score**.

## 4. "New Content" Category Is Ambiguous (v4.1, v4.2)

The 15–20% allocation for "new content" is never defined:
- New to the user? Or newly added to the course?
- How is new content **introduced** — is there a lesson progression order, or does the engine pick new items freely across all lessons?
- If lesson-ordered: what triggers advancement to the next lesson?
- If free-pick: what happened to "thematically grouped" from v4 §2?

## 5. No Definition of "Session" Lifecycle (All v4 docs)

The docs assume a session concept but never define:
- When does a session **start** and **end**? User-initiated? Time-based? Item-count-based?
- Can a user **abandon** mid-session? What happens to the remaining items?
- Is state persisted per-item (on each answer) or per-session (on completion)?
- Can a user have **multiple active sessions** or modes simultaneously?

## 6. Cold Start Strategy Is Too Vague (v4.2 §9)

"Prioritize new vocabulary, introduce verbs gradually, minimal conjugation early" — this needs quantification:
- How many sessions before conjugation appears?
- What's the new-item rate for session 1 vs session 10?
- Is there a minimum vocabulary threshold before the unified mix kicks in?

## 7. Adaptation Rules Lack Thresholds (v4.1 §4, v4.2.1 §2)

"If struggling -> easier formats" — what constitutes "struggling"?
- Accuracy below X% over last N items?
- Consecutive errors?
- Per-item or per-session?

Similarly "correct & fast" — what is "fast"? Response time thresholds aren't specified.

## 8. Vocabulary Normalization Edge Cases (v4.2 §2)

`lowercase + trim + remove punctuation` is insufficient for Dutch:
- "de/het" articles — is "huis" the same as "het huis"?
- Compound words — is "schoolgebouw" unique from "school" + "gebouw"?
- Verb infinitives vs conjugated forms — is "werken" the same word as "werk"?
- Diminutives — "huis" vs "huisje"?

## 9. No Error Recovery or Graceful Degradation

What happens when:
- The candidate pool is nearly empty (user has reviewed everything, nothing is due)?
- A content pack has a lesson with <18 vocab items — reject the whole pack or just that lesson?
- The scoring produces all zeros?

## 10. Mode Switching Data Flow Unclear (v4.2.1 §5)

"Modes are independent, progress shared via review system" — but:
- If I drill conjugations in Conjugation Mode, does that affect the conjugation due-dates in Unified Mode? (Presumably yes, but should be explicit)
- Can mode-specific adaptation state (e.g., "user struggles with jij/hij") carry over to Unified Mode?

## 11. Missing: Content Pack Validation Pipeline

v4 says 18–22 vocab per lesson, v4.2 says unique words per course. But there's no specification for:
- When validation runs (import only? or also on content updates?)
- What the error reporting looks like for content authors
- Whether partial imports are allowed (valid lessons imported, invalid ones rejected)

## 12. No Specification for Exercise Generation from Vocabulary

v4 §2 says each word must appear in ">=1 sentence" and ">=1 exercise" — but the exercise generator (v4.1 §3.3) doesn't define **how** exercises are generated from vocabulary items. Are exercises pre-authored in content packs, or dynamically generated? If generated, by what rules?

---

**Bottom line:** The v4 series has a solid vision — adaptive, unified, randomized learning — but the **algorithmic core** (scoring, mixing, adaptation thresholds) is specified in pseudocode-level hand-waves. An implementer would need to make dozens of judgment calls that could produce very different learning experiences. The most critical gap is the `mix()` + scoring + quota interaction, which is the heart of the engine.
