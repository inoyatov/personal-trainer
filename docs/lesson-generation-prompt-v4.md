# Lesson & Course Generation Guide v4

## For Language Specialists Creating Dutch A2 Content

You are a Dutch language specialist creating structured JSON content for a desktop application that helps learners prepare for the Dutch naturalization (inburgering) exam at A2 level.

The app generates **7 exercise types** automatically from your content:

| Exercise | What You Provide | What the App Does |
|----------|-----------------|-------------------|
| Multiple-choice gap-fill | Sentences + vocabulary | Blanks a vocab word, offers 4 options |
| Typed gap-fill | Sentences + vocabulary | Same blank, learner types the answer |
| Word order | Sentences (4-8 words) | Scrambles words, learner reorders |
| Dialog completion | Dialog turns | Blanks a keyword in a dialog turn |
| Conjugation typing | Verbs + conjugation forms | Shows pronoun + infinitive, learner types form |
| Conjugation in sentence | Verbs + sentences + sentenceVerbs | Blanks the verb in a sentence, shows infinitive hint |
| Guided writing | Writing prompts | Learner writes freely, app checks keywords |

Your job is to create **linguistically correct, A2-level content** that feeds all these exercise types.

---

## What Changed in v4

| Rule | v3 | v4 |
|------|----|----|
| Vocabulary per lesson | 6-10 items | **18-22 items** (minimum 18, absolute requirement) |
| Sentences per lesson | 6-10 | **18-25** (at least one per vocabulary item) |
| Vocabulary uniqueness | Not enforced | **No duplicate words within a course** |
| Word storage | Any form | **Nouns without article as lemma, verbs as infinitive** |
| Verbs per lesson | 1-3 target | **3-5 target** verbs |
| Dialogs per lesson | 1 dialog, 4-6 turns | **1-2 dialogs, 4-8 turns each** |

**CRITICAL: Lessons with fewer than 18 vocabulary items will be REJECTED by the importer.** They will not be imported at all.

---

## Content Structure

```
Course (~1500-2000 unique words target for A2)
  └── Module (thematic section, 4-6 lessons)
        └── Lesson (one topic)
              ├── Vocabulary (18-22 items, thematically grouped)
              ├── Sentences (18-25, each using ≥1 vocabulary lemma)
              ├── Dialogs (1-2 realistic conversations)
              ├── Verbs (3-5 target with conjugation tables)
              ├── Grammar patterns (1-2, optional)
              └── Writing prompts (1-2)
```

**Course size math:**
- 90 lessons x 18 words/lesson = 1620 unique words
- This meets the CEFR A2 vocabulary target (~1500-2000 words)
- **Every word must be unique within the course** — no repeats across lessons

---

## Two JSON Formats

### Format 1: Lesson Pack (single lesson -> imported into existing module)

```json
{
  "lesson": { ... },
  "classGroups": [ ... ],
  "vocabulary": [ ... ],
  "sentences": [ ... ],
  "dialogs": [ ... ],
  "dialogTurns": [ ... ],
  "verbs": [ ... ],
  "verbConjugationSets": [ ... ],
  "verbConjugationForms": [ ... ],
  "lessonVerbs": [ ... ],
  "sentenceVerbs": [ ... ],
  "grammarPatterns": [ ... ],
  "writingPrompts": [ ... ]
}
```

### Format 2: Course Pack (full course with modules and lessons)

```json
{
  "manifest": { "name": "...", "version": "1.0", "description": "...", "author": "..." },
  "courses": [ ... ],
  "modules": [ ... ],
  "lessons": [ ... ],
  "classGroups": [ ... ],
  "vocabulary": [ ... ],
  "sentences": [ ... ],
  "dialogs": [ ... ],
  "dialogTurns": [ ... ],
  "verbs": [ ... ],
  "verbConjugationSets": [ ... ],
  "verbConjugationForms": [ ... ],
  "lessonVerbs": [ ... ],
  "sentenceVerbs": [ ... ],
  "grammarPatterns": [ ... ],
  "writingPrompts": [ ... ]
}
```

---

## Entity Specifications

### Lesson

```json
{
  "id": "les-supermarkt",
  "moduleId": "mod-winkelen",
  "title": "Bij de supermarkt (At the supermarket)",
  "description": "Learn vocabulary for grocery shopping",
  "orderIndex": 0,
  "estimatedMinutes": 20
}
```

### Class Groups

Every lesson needs class groups. These are tabs shown on the lesson page.

```json
[
  { "id": "cg-supermarkt-vocab", "lessonId": "les-supermarkt", "type": "vocabulary", "title": "Woordenschat", "orderIndex": 0 },
  { "id": "cg-supermarkt-dialog", "lessonId": "les-supermarkt", "type": "dialog", "title": "Dialoog", "orderIndex": 1 },
  { "id": "cg-supermarkt-grammar", "lessonId": "les-supermarkt", "type": "grammar", "title": "Grammatica", "orderIndex": 2 },
  { "id": "cg-supermarkt-writing", "lessonId": "les-supermarkt", "type": "writing", "title": "Schrijven", "orderIndex": 3 }
]
```

### Vocabulary Items (18-22 per lesson)

```json
{
  "id": "v-supermarkt-1",
  "lemma": "brood",
  "displayText": "het brood",
  "article": "het",
  "partOfSpeech": "noun",
  "translation": "bread",
  "classGroupId": "cg-supermarkt-vocab",
  "difficulty": 1.0
}
```

**RULES:**

1. **18-22 vocabulary items per lesson** — lessons with <18 items are REJECTED by the importer
2. **All items must be thematically related** to the lesson topic
3. Mix parts of speech: ~10-12 nouns, ~4-5 verbs (as vocab), ~3-4 adjectives/adverbs
4. **`lemma`** = dictionary headword, no article:
   - Nouns: `"brood"` not `"het brood"` (article goes in `article` field)
   - Verbs: `"kopen"` (infinitive form)
   - Adjectives: `"goedkoop"` (base form)
5. **`displayText`** = how the word is shown to the learner: `"het brood"`, `"kopen"`, `"goedkoop"`
6. **`article`**: `"de"`, `"het"`, or `null` for non-nouns
7. **`partOfSpeech`**: `"noun"`, `"verb"`, `"adjective"`, `"adverb"`
8. **Each lemma MUST appear as an exact whole word in at least one sentence** — the app matches using `\bword\b` regex
9. **No duplicate words within a course** — the importer checks `lowercase(trim(lemma))` for uniqueness per course. Duplicate words are silently skipped.

### Sentences (18-25 per lesson)

```json
{
  "id": "s-supermarkt-1",
  "text": "Ik koop elke dag brood bij de supermarkt.",
  "translation": "I buy bread at the supermarket every day.",
  "lessonId": "les-supermarkt",
  "classGroupId": "cg-supermarkt-vocab"
}
```

**CRITICAL RULES:**

1. **At least one sentence per vocabulary item** — every `lemma` must appear as a whole word in at least one sentence
2. **18-25 sentences per lesson** (at least as many as vocabulary items)
3. **4-8 words per sentence** works best for word order exercises (< 3 words are skipped)
4. A2 level: short, clear, practical, daily-life scenarios
5. **Do NOT use conjugated forms as lemmas** — e.g., lemma `kopen` must appear as "kopen" in a sentence, not only as "koop"
6. Sentences should use varied vocabulary — aim for 2-3 vocab items per sentence where natural
7. Include a mix of statement, question, and imperative forms

**Correct:**
- Lemma: `brood` -> "Ik wil graag een **brood** kopen." ✅
- Lemma: `kopen` -> "Ik wil graag een brood **kopen**." ✅

**WRONG (avoid):**
- Lemma: `kopen` -> "Ik **koop** brood." ❌ (conjugated form ≠ lemma)
- Lemma: `betaling` -> "Ik **betaal** met pinpas." ❌ (different word form)

### Dialogs (1-2 per lesson)

```json
{
  "id": "d-supermarkt-1",
  "lessonId": "les-supermarkt",
  "title": "Bij de kassa",
  "scenario": "Paying at the supermarket checkout",
  "classGroupId": "cg-supermarkt-dialog"
}
```

### Dialog Turns (4-8 per dialog)

```json
{
  "id": "dt-supermarkt-1",
  "dialogId": "d-supermarkt-1",
  "speaker": "Kassamedewerker",
  "text": "Goedemiddag, heeft u een bonuskaart?",
  "translation": "Good afternoon, do you have a loyalty card?",
  "orderIndex": 0
}
```

**Rules:**
- **2 speakers** per dialog
- **4-8 turns** per dialog
- Turn 0 (first turn) is context-only — not used for exercises
- Use **longer content words** (3+ letters) — short function words (de, het, ik, je, en, of, in, op, is) are skipped
- The app picks the **longest content words** as exercise targets

### Verbs (3-5 target per lesson)

```json
{
  "id": "verb-kopen",
  "infinitive": "kopen",
  "translation": "to buy",
  "type": "regular",
  "isSeparable": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique ID: `verb-{infinitive}` |
| `infinitive` | string | Dutch infinitive form |
| `translation` | string | English translation |
| `type` | `"regular"` or `"irregular"` | Affects error classification |
| `isSeparable` | boolean | For separable verbs like "opbellen" |

### Verb Conjugation Sets

```json
{
  "id": "verb-kopen-present",
  "verbId": "verb-kopen",
  "tense": "present",
  "mood": "indicative"
}
```

One set per verb per tense. For now, only `"present"` tense is used.

### Verb Conjugation Forms (all 9 pronouns required)

```json
{ "id": "verb-kopen-present-ik", "conjugationSetId": "verb-kopen-present", "pronoun": "IK", "form": "koop" },
{ "id": "verb-kopen-present-jij", "conjugationSetId": "verb-kopen-present", "pronoun": "JIJ", "form": "koopt" },
{ "id": "verb-kopen-present-u", "conjugationSetId": "verb-kopen-present", "pronoun": "U", "form": "koopt" },
{ "id": "verb-kopen-present-hij", "conjugationSetId": "verb-kopen-present", "pronoun": "HIJ", "form": "koopt" },
{ "id": "verb-kopen-present-zij_sg", "conjugationSetId": "verb-kopen-present", "pronoun": "ZIJ_SG", "form": "koopt" },
{ "id": "verb-kopen-present-het", "conjugationSetId": "verb-kopen-present", "pronoun": "HET", "form": "koopt" },
{ "id": "verb-kopen-present-wij", "conjugationSetId": "verb-kopen-present", "pronoun": "WIJ", "form": "kopen" },
{ "id": "verb-kopen-present-jullie", "conjugationSetId": "verb-kopen-present", "pronoun": "JULLIE", "form": "kopen" },
{ "id": "verb-kopen-present-zij_pl", "conjugationSetId": "verb-kopen-present", "pronoun": "ZIJ_PL", "form": "kopen" }
```

**All 9 pronouns required:** `IK`, `JIJ`, `U`, `HIJ`, `ZIJ_SG`, `HET`, `WIJ`, `JULLIE`, `ZIJ_PL`

**Common conjugation patterns:**
- Regular: stem + t for jij/u/hij/zij/het, infinitive for wij/jullie/zij(pl)
- Irregular verbs (zijn, hebben, gaan, komen, etc.) must have correct forms

### Lesson Verbs

```json
{ "lessonId": "les-supermarkt", "verbId": "verb-kopen", "role": "target", "orderIndex": 0 }
```

**Roles:**
- `"target"` — gets conjugation drills, 3-5 per lesson
- `"supporting"` — appears in context only
- `"focus_irregular"` — irregular verb flagged for extra practice (used for zijn, hebben, gaan, etc.)

### Sentence Verbs

```json
{ "sentenceId": "s-supermarkt-3", "verbId": "verb-kopen", "surfaceForm": "kopen", "isFinite": false }
```

Links a verb to its surface form in a specific sentence. Used for "conjugation in sentence" exercises.

### Grammar Patterns (1-2 per lesson, optional)

```json
{
  "id": "gp-supermarkt-1",
  "name": "Hoeveel kost ...?",
  "description": "Asking about prices",
  "explanationMarkdown": "**Hoeveel kost** + het/de + zelfstandig naamwoord?\n\n- Hoeveel kost het brood?\n- Hoeveel kosten de appels?",
  "examples": "[\"Hoeveel kost een kilo kaas?\", \"Hoeveel kosten de tomaten?\"]",
  "lessonId": "les-supermarkt"
}
```

Note: `examples` is a **JSON string** containing an array.

### Writing Prompts (1-2 per lesson)

```json
{
  "id": "wp-supermarkt-1",
  "lessonId": "les-supermarkt",
  "promptText": "Write a short shopping list message to your partner. Say what you need to buy at the supermarket and how much it costs.",
  "targetPatterns": "[\"Ik moet kopen\", \"Hoeveel kost\", \"We hebben nodig\"]",
  "expectedKeywords": "[\"supermarkt\", \"kopen\", \"brood\", \"kaas\", \"euro\", \"nodig\"]",
  "difficulty": 1.0
}
```

Include **3-6 expected keywords** and **1-3 target patterns**.

---

## ID Naming Convention

| Entity | Pattern | Example |
|--------|---------|---------|
| Course | `course-{topic}` | `course-dagelijks-leven` |
| Module | `mod-{topic}` | `mod-winkelen` |
| Lesson | `les-{topic}` | `les-supermarkt` |
| Class Group | `cg-{lesson}-{type}` | `cg-supermarkt-vocab` |
| Vocabulary | `v-{lesson}-{n}` | `v-supermarkt-1` |
| Sentence | `s-{lesson}-{n}` | `s-supermarkt-1` |
| Dialog | `d-{lesson}-{n}` | `d-supermarkt-1` |
| Dialog Turn | `dt-{lesson}-{n}` | `dt-supermarkt-1` |
| Grammar | `gp-{lesson}-{n}` | `gp-supermarkt-1` |
| Writing Prompt | `wp-{lesson}-{n}` | `wp-supermarkt-1` |
| Verb | `verb-{infinitive}` | `verb-kopen` |
| Conjugation Set | `verb-{inf}-present` | `verb-kopen-present` |
| Conjugation Form | `verb-{inf}-present-{pronoun}` | `verb-kopen-present-ik` |

---

## Vocabulary Uniqueness Rules

When creating a **course pack** with multiple lessons:

1. **No word may appear in more than one lesson** within the same course
2. The importer normalizes words: `lowercase(trim(lemma))`
3. "huis" in lesson 1 and "huis" in lesson 5 = DUPLICATE (second one skipped)
4. "huis" and "huisje" = OK (different lemmas)
5. "werken" and "werk" = OK (different lemmas, but be intentional)
6. Plan your vocabulary distribution across lessons before generating

**Tip:** Create a vocabulary master list for the entire course first, then distribute words to lessons by theme.

---

## Checklist Before Submitting

### Vocabulary (CRITICAL)
- [ ] **18-22 vocabulary items per lesson** (< 18 = lesson REJECTED)
- [ ] Every `lemma` appears as a whole word in at least one sentence
- [ ] No duplicate lemmas within the course (case-insensitive)
- [ ] Correct `article` (de/het) for all nouns
- [ ] `lemma` is the dictionary headword (no articles, no conjugated forms)
- [ ] Thematically coherent — all items relate to the lesson topic

### Sentences
- [ ] 18-25 sentences per lesson
- [ ] Every vocabulary item covered by at least one sentence
- [ ] 4-8 words per sentence (for word order exercises)
- [ ] A2 level: short, clear, daily-life scenarios

### Dialogs
- [ ] 1-2 dialogs per lesson, 4-8 turns each
- [ ] Content words (3+ letters) in dialog turns
- [ ] Realistic A2-level conversation

### Verbs
- [ ] 3-5 target verbs per lesson
- [ ] All 9 pronoun forms for each verb (present tense)
- [ ] All conjugation forms linguistically correct
- [ ] `sentenceVerbs` link verbs to their surface forms in sentences
- [ ] Irregular verbs marked with `type: "irregular"`

### General
- [ ] Every `id` is unique across the entire file
- [ ] All foreign key references (`lessonId`, `classGroupId`, `dialogId`, `verbId`, `conjugationSetId`) are correct
- [ ] Dialog turns have sequential `orderIndex` starting from 0
- [ ] Writing prompt includes expectedKeywords and targetPatterns
- [ ] Valid JSON (no trailing commas, proper quoting)

---

## Suggested Topics for Dutch A2 Inburgering

**Daily Life:** Bij de supermarkt, Op het postkantoor, Bij de bank, In het restaurant, De weg vragen, Op de markt, Bij de bakker, Bij de drogist
**Health:** Bij de huisarts, Bij de tandarts, Bij de apotheek, Eerste hulp, Gezond eten, Sporten, Bij het ziekenhuis
**Work & Education:** Solliciteren, Op het werk, Op school, Bij het UWV, Vergaderingen, Collega's, Werkrooster
**Government:** Bij de gemeente, Belastingdienst, Rijbewijs halen, Verzekeringen, DigiD, Toeslagen, Verblijfsvergunning
**Social:** Kennismaken, Uitnodigingen, Feestdagen, Buren, Verjaardagen, Vrijwilligerswerk
**Housing:** Een huis zoeken, Verhuizen, Reparaties, Nutsvoorzieningen, Huurcontract, Woningcorporatie
**Transport:** Met de trein, Met de bus, De fiets, Autorijden, OV-chipkaart, Navigatie
**Communication:** Telefoneren, E-mail schrijven, Een brief schrijven, Online formulieren, Afspraak maken

---

## ChatGPT / Claude Prompt Template

### Single Lesson (Lesson Pack)

```
You are a Dutch language specialist. Generate a complete lesson pack in JSON format for a Dutch A2 learning app.

Topic: [TOPIC]
Lesson ID prefix: les-[topic-slug]

CRITICAL REQUIREMENTS (v4):
1. Create exactly 20 vocabulary items with correct de/het articles — ALL thematically related to the topic
   - Mix: ~12 nouns, ~4 verbs (infinitive as lemma), ~4 adjectives/adverbs
   - `lemma` = dictionary headword without article
   - `displayText` = how shown to learner (e.g., "het brood")
2. Create 20-22 sentences where EACH vocabulary lemma appears as an exact whole word in at least one sentence
   - 4-8 words per sentence
   - A2 level: short, practical, daily-life
   - Do NOT use only conjugated forms — the infinitive lemma must appear somewhere
3. Create 1-2 dialogs with 4-8 turns each between two speakers
   - Use longer content words (3+ letters)
   - Realistic A2-level conversation matching the topic
4. Create 4 verbs with complete present-tense conjugation tables
   - All 9 pronouns: IK, JIJ, U, HIJ, ZIJ_SG, HET, WIJ, JULLIE, ZIJ_PL
   - Mark irregular verbs correctly
   - Link each verb to the lesson with role "target"
   - Create sentenceVerbs linking verbs to their surface forms in sentences
5. Create 1-2 writing prompts with 3-6 expectedKeywords and 1-3 targetPatterns
6. Create 1 grammar pattern relevant to the topic
7. Use the exact JSON structure with all arrays: lesson, classGroups, vocabulary, sentences, dialogs, dialogTurns, verbs, verbConjugationSets, verbConjugationForms, lessonVerbs, sentenceVerbs, grammarPatterns, writingPrompts
8. All IDs must be unique using patterns: v-{topic}-{n}, s-{topic}-{n}, verb-{infinitive}, etc.
9. All conjugation forms must be linguistically correct Dutch
10. Output ONLY valid JSON, no explanation
```

### Full Course (Course Pack)

```
You are a Dutch language specialist. Generate a complete course pack in JSON format for a Dutch A2 learning app.

Course: [COURSE TITLE]
Modules and lessons:
- Module 1: [TITLE] — Lessons: [L1], [L2], [L3], [L4]
- Module 2: [TITLE] — Lessons: [L5], [L6], [L7], [L8]
...

CRITICAL REQUIREMENTS (v4):
1. Each lesson MUST have exactly 20 vocabulary items (minimum 18 — lessons with fewer are REJECTED)
2. NO duplicate vocabulary words across the entire course (case-insensitive lemma check)
3. Plan vocabulary distribution FIRST, then assign words to lessons by theme
4. Each vocabulary lemma must appear in at least one sentence in its lesson
5. 20-22 sentences per lesson, 4-8 words each
6. 1-2 dialogs per lesson with 4-8 turns each
7. 4 target verbs per lesson with full present-tense conjugation (all 9 pronouns)
8. 1-2 writing prompts per lesson
9. 1 grammar pattern per lesson
10. All IDs globally unique across the entire course
11. All conjugation forms linguistically correct Dutch
12. All content A2 level

Use the full course pack JSON structure with manifest, courses, modules, lessons, classGroups, vocabulary, sentences, dialogs, dialogTurns, verbs, verbConjugationSets, verbConjugationForms, lessonVerbs, sentenceVerbs, grammarPatterns, writingPrompts.

Output ONLY valid JSON.
```

---

## Content Density Summary

| Entity | Per Lesson | Per Module (4-6 lessons) | Per Course (90 lessons) |
|--------|-----------|------------------------|----------------------|
| Vocabulary | 18-22 | 72-132 | 1620-1980 |
| Sentences | 18-25 | 72-150 | 1620-2250 |
| Dialogs | 1-2 | 4-12 | 90-180 |
| Dialog turns | 4-16 | 16-96 | 360-1440 |
| Target verbs | 3-5 | 12-30 | 270-450 |
| Writing prompts | 1-2 | 4-12 | 90-180 |
| Grammar patterns | 1-2 | 4-12 | 90-180 |
