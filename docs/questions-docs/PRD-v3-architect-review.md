# Architect's Review: PRD v3.0 – v3.3

## Document Scope

Review of four PRD documents covering verb conjugation support:
- PRD v3.0 — Core verb conjugation system
- PRD v3.1 — Simplified verb conjugation (restatement of v3)
- PRD v3.2 — Error classification and adaptive feedback
- PRD v3.3 — Pattern-based learning and error clustering

---

## 1. What's Well-Designed

1. **Conjugation as embedded micro-grammar** (v3 §5.2) — correct pedagogical approach. Not a separate grammar module, but woven into practical lessons.
2. **Per-verb-per-pronoun review tracking** (v3 §13.2) — essential for identifying "knows *ik werk* but not *hij werkt*" patterns.
3. **Length-based typo tolerance** (v3 §12.2) — smart: exact match for short forms like "ben", "is", "ga" prevents false positives.
4. **Reuse existing scheduler** (v3 §13.1) — correct. Don't replace working system.
5. **Error classification** (v3.2) — valuable for targeted feedback. MISSING_T is the most common A2 error.
6. **Progressive document structure** — v3 → v3.1 → v3.2 → v3.3 layers naturally.

---

## 2. Architectural Concerns (Resolvable)

### 2.1 Schema Divergence Between v3 and v3.1

**Issue**: v3 has a 3-table hierarchy (`verbs` → `verb_conjugation_sets` → `verb_conjugation_forms`), v3.1 flattens to 2 tables (`verbs` → `verb_conjugations`).

**Recommendation**: Use v3's 3-table structure. The extra `conjugation_sets` table costs nothing and enables future tense expansion (past tense, perfect tense) without a breaking migration.

### 2.2 v3.2's `verb_rules` Table is Premature

**Issue**: For 15 seed verbs, explicit storage is simpler and more reliable than rule-based generation. We can derive rules later from stored forms.

**Recommendation**: Defer `verb_rules` table. Store all forms explicitly. Add rule generation as an optimization if the verb count exceeds 100+.

### 2.3 v3.3's Pattern System Adds Complexity for Small Data

**Issue**: `patterns`, `verb_patterns`, `user_pattern_stats` — 3 new tables for what amounts to 15 verb-pattern mappings and 5 pattern types. This could be computed at query time from `conjugation_attempts`.

**Recommendation**: Implement v3.3 patterns as computed analytics in the service layer, not as new tables. Add tables only if performance requires caching (unlikely at A2 scale).

### 2.4 Conflicts Between Documents

| Area | v3 Says | v3.1/v3.2/v3.3 Says | Impact |
|------|---------|---------------------|--------|
| Schema | 3-table conjugation hierarchy | 2-table flat | Need decision (Q1) |
| Pronoun keys | Explicit IK, JIJ, U, HIJ, ZIJ_SG, HET, WIJ, JULLIE, ZIJ_PL | Simple string `pronoun` | Need alignment |
| Session mixing | "Separate Conjugation Review" | "Dynamic mixed sessions" | Need decision (Q2) |
| Exercise modes | "Typed recall is primary" | v3.2 adds MC for easy mode | Contradicts stated philosophy |
| Typo tolerance | Length-based (1-3: exact, 4-6: config, 7+: normal) | v3.2 doesn't specify | v3's rules are better, use those |

### 2.5 Missing Specifications

| What's Missing | Where | Impact |
|---------------|-------|--------|
| Stem extraction logic for WRONG_STEM detection | v3.2 | Blocks error classification |
| `alternate_forms_json` schema | v3 §8.3 | Blocks alternate form acceptance |
| Definition of lesson-verb roles (target/supporting/focus) | v3 §8.4 | Blocks exercise generation |
| Content pack JSON format for verbs | v3 §17 | Blocks import/export |
| Regular verb conjugation algorithm | v3.2 | Not needed if forms stored explicitly |
| Pattern mastery initialization and thresholds | v3.3 | Blocks pattern analytics |
| How conjugation review items compete with vocabulary items | v3 §13 | Blocks session building |
| Dialog-to-conjugation exercise conversion logic | v3.3 | Blocks dialog integration |

---

## 3. Questions Requiring Product Owner Decisions

### Q1: Schema Strategy — 3-table or 2-table? [BLOCKING]

v3 proposes: `verbs` → `verb_conjugation_sets` (tense/mood container) → `verb_conjugation_forms` (per-pronoun)

v3.1 simplifies to: `verbs` → `verb_conjugations` (flat: verbId + tense + pronoun + form)

**Trade-off**: The 3-table model supports future tense expansion cleanly. The 2-table model is simpler for MVP.

**Architect recommendation**: 3-table (v3's design). One extra join, but avoids a schema migration when we add past tense later.

**Decision needed from PO**: Which approach?

---

### Q2: Should conjugation exercises appear in the main study session or separate? [BLOCKING]

- v3 §19.3 says: "allow separate 'Conjugation Review' start action"
- v3.3 says: "build sessions mixing pattern drills + review + new items"

**Option A**: Separate "Practice Conjugation" button on lesson page (simpler, clear UX)
**Option B**: Mixed into the regular study session based on mode (more integrated, but complex)
**Option C**: Both — separate button + optional mixing in Deep mode

**Architect recommendation**: Option C, implement A first, add mixing later.

**Decision needed from PO + Designer**: Which option for MVP?

---

### Q3: Error classification scope for MVP

v3.2 defines 5 error types: MISSING_T, WRONG_STEM, WRONG_PRONOUN_FORM, TYPO, UNKNOWN

**Concern**: Detecting WRONG_STEM and WRONG_PRONOUN_FORM requires stem extraction logic that isn't specified.

**Option A**: MVP ships with 3 types: CORRECT, TYPO, WRONG (simple)
**Option B**: MVP ships with all 5 types using heuristic detection (check if answer matches another pronoun's form → WRONG_PRONOUN_FORM; check if answer is missing trailing -t → MISSING_T)

**Architect recommendation**: Option B — the heuristics are straightforward.

**Decision needed from PO**: How many error types for MVP?

---

### Q4: Pattern system — tables or computed?

v3.3 introduces `patterns`, `verb_patterns`, `user_pattern_stats` tables.

**Concern**: With 15 verbs and 5 pattern types, the overhead of 3 new tables seems high. Pattern stats can be computed from `conjugation_attempts` at query time.

**Architect recommendation**: Compute in service layer, not tables. Add tables only if performance requires it.

**Decision needed from PO**: Tables (v3.3's design) or computed service layer?

---

### Q5: What are the lesson-verb "roles"? [BLOCKING]

v3 §8.4 defines `lesson_verbs` with a `role` field: "target verb", "supporting verb", "irregular focus verb".

**Missing definitions**:
- Does "target verb" mean it gets conjugation exercises generated?
- Does "supporting verb" mean it appears in sentences but isn't drilled separately?
- Does "irregular focus verb" get extra practice repetitions?

**Decision needed from PO**: Define what each role controls in exercise generation and UI display.

---

### Q6: Content pack format for verbs

v3 §17 says import/export must include verbs, but doesn't specify the JSON structure.

**Architect proposal**:
```json
{
  "verbs": [
    {
      "id": "verb-wonen",
      "infinitive": "wonen",
      "translation": "to live",
      "type": "regular",
      "isSeparable": false,
      "conjugations": {
        "present": {
          "IK": "woon",
          "JIJ": "woont",
          "U": "woont",
          "HIJ": "woont",
          "ZIJ_SG": "woont",
          "HET": "woont",
          "WIJ": "wonen",
          "JULLIE": "wonen",
          "ZIJ_PL": "wonen"
        }
      }
    }
  ],
  "lessonVerbs": [
    { "lessonId": "les-1", "verbId": "verb-wonen", "role": "target", "orderIndex": 0 }
  ],
  "sentenceVerbs": [
    { "sentenceId": "s-1", "verbId": "verb-wonen", "surfaceForm": "woon", "isFinite": true }
  ]
}
```

**Decision needed from PO**: Is this format acceptable?

---

## 4. Questions Requiring Designer Decisions

### Q7: Pronoun display labels

v3 §10.1 defines internal keys (IK, JIJ, U, etc.) but says "Display labels can remain UI-specific."

**Option A**: Full formal — "ik", "jij/je", "u", "hij", "zij (sg)", "het", "wij/we", "jullie", "zij (pl)"
**Option B**: Simplified — "ik", "jij", "u", "hij", "zij", "het", "wij", "jullie", "zij (pl)"
**Option C**: Grouped common — "ik", "jij/je", "hij/zij/het", "wij", "jullie", "zij"

**Decision needed from Designer**: Which display format?

---

### Q8: Confidence capture on conjugation exercises?

Current system captures confidence (Guessed/Sure/Confident) after every answer.

**Concern**: Conjugation drills should feel fast-paced. The confidence widget adds 1-3 seconds per exercise.

**Option A**: Show confidence widget after every conjugation answer (consistent)
**Option B**: Skip confidence for conjugation (faster drills)
**Option C**: Only show confidence when the answer was incorrect (compromise)

**Architect recommendation**: Option B — conjugation should be fast drill-like practice.

**Decision needed from PO**: Confidence on conjugation: yes/no/conditional?

---

### Q9: Dashboard integration scope

v3 §16 says dashboard "may show" conjugation metrics. This is vague.

**Architect proposal for MVP**:
- Add "Verbs Practiced" count to dashboard stats row
- Add "Weak Pronouns" insight card on progress page
- No separate conjugation dashboard section

**Decision needed from Designer**: Is this sufficient, or do you want a dedicated conjugation progress section?

---

### Q10: Seed data verification [BLOCKING]

v3 §18 lists 15 seed verbs but provides no conjugation tables. Dutch irregular verbs (zijn, hebben, gaan, komen, willen, kunnen, moeten, doen) have forms that must be linguistically correct.

**Options**:
- Architect hardcodes based on standard Dutch grammar references (fastest)
- PO provides a verified conjugation spreadsheet (most accurate)
- Generate via ChatGPT and PO reviews (balanced)

**Architect recommendation**: Hardcode and PO reviews. Only 15 verbs, forms are well-documented.

**Decision needed from PO**: Who verifies the conjugation tables?

---

## 5. Decision Priority

| # | Question | For | Blocking? | Default if No Answer |
|---|----------|-----|-----------|---------------------|
| Q1 | 3-table or 2-table schema | PO | **Yes** | Use 3-table (v3 design) |
| Q2 | Separate or mixed sessions | PO + Designer | **Yes** | Separate first (Option A) |
| Q5 | Lesson-verb role definitions | PO | **Yes** | Target = drill, Supporting = context only, Focus = extra reps |
| Q10 | Seed data verification | PO | **Yes** | Architect hardcodes, PO reviews |
| Q3 | Error classification scope | PO | No | 5 types with heuristics (Option B) |
| Q4 | Pattern tables or computed | PO | No | Computed in service layer |
| Q6 | Content pack JSON format | PO | No | Use proposed format |
| Q7 | Pronoun display labels | Designer | No | Option B (simplified) |
| Q8 | Confidence on conjugation | PO | No | Skip (Option B) |
| Q9 | Dashboard scope | Designer | No | Minimal (add count + weak pronouns) |

**If PO/Designer cannot respond immediately**: I will proceed using the "Default if No Answer" column and adjust later. The 4 blocking questions have reasonable defaults that can be changed with a migration.

---

## 6. Recommended Implementation Order

Assuming defaults are accepted:

1. **Migration v004**: Add verb tables (verbs, verb_conjugation_sets, verb_conjugation_forms, lesson_verbs, sentence_verbs)
2. **Migration v005**: Add conjugation review tables (conjugation_review_states, conjugation_attempts)
3. **Seed data**: 15 verbs with present-tense conjugation tables
4. **Conjugation exercise generator**: CONJUGATION_TYPED + CONJUGATION_IN_SENTENCE
5. **Conjugation evaluator**: length-based typo tolerance + error classification
6. **Conjugation review scheduler**: reuse existing 4-path algorithm
7. **UI**: Lesson verb card, conjugation study screen, separate "Practice Conjugation" button
8. **Content import/export**: verb entities in JSON pack format
9. **Dashboard/Progress**: verb count + weak pronoun insights
10. **Tests**: evaluation, generation, review, migration, import/export

Estimated effort: **5-7 days** across all steps.
