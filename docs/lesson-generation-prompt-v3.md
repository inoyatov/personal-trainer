# Lesson & Course Generation Guide v3

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

## Content Structure

The app organizes content as:

```
Course
  └── Module (thematic section)
        └── Lesson (one topic)
              ├── Vocabulary (nouns, verbs, adjectives)
              ├── Sentences (using the vocabulary)
              ├── Dialog (realistic conversation)
              ├── Verbs (with conjugation tables)
              ├── Grammar patterns (optional)
              └── Writing prompts (optional)
```

---

## Two JSON Formats

### Format 1: Lesson Pack (single lesson → imported into existing module)

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
  "moduleId": "ignored-on-import",
  "title": "Bij de supermarkt (At the supermarket)",
  "description": "Learn vocabulary for grocery shopping",
  "orderIndex": 0,
  "estimatedMinutes": 15
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

### Vocabulary Items

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

**Rules:**
- **6-10 vocabulary items** per lesson
- Mix nouns (with correct de/het articles), verbs, and adjectives
- The `lemma` field (base form, no article) **MUST appear as an exact whole word** in at least one sentence
- `partOfSpeech`: one of `"noun"`, `"verb"`, `"adjective"`, `"adverb"`
- `article`: `"de"`, `"het"`, `"een"`, or `null` (for verbs/adjectives)

### Sentences

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
1. **Every sentence MUST contain at least one vocabulary `lemma` as a whole word** (the app matches using `\bword\b` regex)
2. **Every vocabulary item SHOULD appear in at least one sentence** — items without sentences won't generate exercises
3. **6-10 sentences** per lesson (more = more word order exercises)
4. **4-8 words per sentence** works best for word order exercises (< 3 words are skipped)
5. A2 level: short, clear, practical, daily-life scenarios
6. **Do NOT use conjugated forms as lemmas** — e.g., lemma `kopen` must appear as "kopen" in a sentence, not as "koop" or "gekocht"

**Correct:**
- Lemma: `brood` → "Ik wil graag een **brood** kopen." ✅
- Lemma: `kopen` → "Ik wil graag een brood **kopen**." ✅

**WRONG (avoid):**
- Lemma: `kopen` → "Ik **koop** brood." ❌ (conjugated form ≠ lemma)
- Lemma: `betaling` → "Ik **betaal** met pinpas." ❌ (different word form)

### Dialogs

```json
{
  "id": "d-supermarkt",
  "lessonId": "les-supermarkt",
  "title": "Bij de kassa",
  "scenario": "Paying at the supermarket checkout",
  "classGroupId": "cg-supermarkt-dialog"
}
```

### Dialog Turns

```json
{
  "id": "dt-supermarkt-1",
  "dialogId": "d-supermarkt",
  "speaker": "Kassamedewerker",
  "text": "Goedemiddag, heeft u een bonuskaart?",
  "translation": "Good afternoon, do you have a loyalty card?",
  "orderIndex": 0
}
```

**Rules:**
- **2 speakers** per dialog
- **4-6 turns** (the app generates up to 3 exercises per dialog)
- Turn 0 (first turn) is context-only — not used for exercises
- Use **longer content words** (3+ letters) — short function words (de, het, ik, je, en, of, in, op, is) are automatically skipped
- The app picks the **longest content words** as exercise targets

### Grammar Patterns (optional)

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

### Writing Prompts (optional but recommended)

```json
{
  "id": "wp-supermarkt",
  "lessonId": "les-supermarkt",
  "promptText": "Write a short shopping list message to your partner. Say what you need to buy at the supermarket and how much it costs.",
  "targetPatterns": "[\"Ik moet kopen\", \"Hoeveel kost\", \"We hebben nodig\"]",
  "expectedKeywords": "[\"supermarkt\", \"kopen\", \"brood\", \"kaas\", \"euro\", \"nodig\"]",
  "difficulty": 1.0
}
```

**The app checks:**
- Non-empty text
- Minimum 5 words
- Capitalization at sentence start
- Ending punctuation
- >= 50% of expected keywords present
- At least one target pattern used
- Sentence structure (subject + verb)

Include **3-6 expected keywords** and **1-3 target patterns**.

---

## NEW IN v3: Verb Conjugation Content

### Why This Matters

The app now teaches Dutch verb conjugation through **typed recall exercises**. When you include verbs in a lesson, learners get:
1. **Conjugation typing**: "Conjugate 'werken' for 'ik'" → learner types "werk"
2. **Conjugation in sentence**: "Ik ____ in Amsterdam. (wonen)" → learner types "woon"

The app classifies errors intelligently:
- Missing -t ending (most common A2 mistake)
- Using wrong pronoun's form
- Typos (with strict tolerance for short forms like "ben", "is", "ga")

### Verbs

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
| `id` | string | Unique ID. Pattern: `verb-{infinitive}` |
| `infinitive` | string | Dutch infinitive form |
| `translation` | string | English translation |
| `type` | `"regular"` or `"irregular"` | Affects how the app treats conjugation errors |
| `isSeparable` | boolean | For separable verbs like "opbellen" (not fully supported yet, but flag it) |

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

### Verb Conjugation Forms

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

**Conjugation must be linguistically correct!** Common patterns:
- Regular: stem + t for jij/u/hij/zij/het, infinitive for wij/jullie/zij(pl)
- Irregular verbs (zijn, hebben, gaan, komen, etc.) must have correct forms

### Lesson Verbs (linking verbs to lessons)

```json
{ "lessonId": "les-supermarkt", "verbId": "verb-kopen", "role": "target", "orderIndex": 0 }
```

**Roles:**
- `"target"` — gets conjugation drills, appears prominently
- `"supporting"` — appears in context only, not drilled
- `"focus_irregular"` — same as target but flagged for extra practice

**Include 1-3 target verbs per lesson.** Supporting verbs can be more.

### Sentence Verbs (linking verbs to sentences)

```json
{ "sentenceId": "s-supermarkt-3", "verbId": "verb-kopen", "surfaceForm": "kopen", "isFinite": false }
```

This tells the app which verb appears in which sentence and what surface form it takes. Used to generate "conjugation in sentence" exercises.

| Field | Description |
|-------|-------------|
| `sentenceId` | ID of the sentence containing the verb |
| `verbId` | ID of the verb entity |
| `surfaceForm` | The exact form as it appears in the sentence text (e.g., "koop", "kopen", "koopt") |
| `isFinite` | `true` if conjugated finite verb, `false` if infinitive |

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
| Dialog | `d-{lesson}` | `d-supermarkt` |
| Dialog Turn | `dt-{lesson}-{n}` | `dt-supermarkt-1` |
| Grammar | `gp-{lesson}-{n}` | `gp-supermarkt-1` |
| Writing Prompt | `wp-{lesson}` | `wp-supermarkt` |
| Verb | `verb-{infinitive}` | `verb-kopen` |
| Conjugation Set | `verb-{inf}-present` | `verb-kopen-present` |
| Conjugation Form | `verb-{inf}-present-{pronoun}` | `verb-kopen-present-ik` |

---

## Checklist Before Submitting

- [ ] Every `id` is unique across the entire file
- [ ] Every vocabulary `lemma` appears as a whole word in at least one sentence
- [ ] All `lessonId`, `classGroupId`, `dialogId`, `verbId`, `conjugationSetId` references are correct
- [ ] Dialog turns have sequential `orderIndex` starting from 0
- [ ] At least 6 sentences (4-8 words each)
- [ ] Dialog has 4+ turns with content words
- [ ] All verb conjugation forms are **linguistically correct**
- [ ] All 9 pronouns provided for each verb conjugation set
- [ ] `sentenceVerbs` correctly link verbs to their surface forms in sentences
- [ ] Verb `type` is correct: `"regular"` or `"irregular"`
- [ ] Articles (de/het) are correct for Dutch nouns
- [ ] Writing prompt includes expectedKeywords and targetPatterns
- [ ] The JSON is valid (no trailing commas, proper quoting)
- [ ] All Dutch text is A2 level

---

## Suggested Topics for Dutch A2 Inburgering

**Daily Life:** Bij de supermarkt, Op het postkantoor, Bij de bank, In het restaurant, De weg vragen
**Health:** Bij de tandarts, Bij de apotheek, Eerste hulp, Gezond eten
**Work & Education:** Solliciteren, Op het werk, Op school, Bij het UWV
**Government:** Bij de gemeente, Belastingdienst, Rijbewijs halen, Verzekeringen
**Social:** Kennismaken, Uitnodigingen, Feestdagen, Buren
**Housing:** Een huis zoeken, Verhuizen, Reparaties, Nutsvoorzieningen
**Transport:** Met de trein, Met de bus, De fiets, Autorijden

---

## ChatGPT Prompt Template

Copy this prompt to generate a complete lesson:

```
You are a Dutch language specialist. Generate a complete lesson pack in JSON format for a Dutch A2 learning app.

Topic: [TOPIC]
Lesson ID prefix: les-[topic-slug]

Requirements:
1. Create 6-10 vocabulary items with correct de/het articles
2. Create 6-10 sentences where EACH sentence contains at least one vocabulary lemma as an exact whole word (4-8 words per sentence)
3. Create one dialog with 4-6 turns between two speakers (use longer content words)
4. Create 2-3 verbs with complete present-tense conjugation tables (all 9 pronouns: IK, JIJ, U, HIJ, ZIJ_SG, HET, WIJ, JULLIE, ZIJ_PL)
5. Link verbs to the lesson as "target" role
6. Link verbs to sentences via sentenceVerbs (show which verb surface form appears in which sentence)
7. Create one writing prompt with 3-6 expectedKeywords and 1-3 targetPatterns
8. Create one grammar pattern relevant to the topic
9. Use the exact JSON structure with all arrays: lesson, classGroups, vocabulary, sentences, dialogs, dialogTurns, verbs, verbConjugationSets, verbConjugationForms, lessonVerbs, sentenceVerbs, grammarPatterns, writingPrompts
10. All IDs must be unique using the patterns: v-{topic}-{n}, s-{topic}-{n}, verb-{infinitive}, etc.
11. All conjugation forms must be linguistically correct Dutch
12. Keep all Dutch text at A2 level
13. Output ONLY valid JSON, no explanation

For irregular verbs (zijn, hebben, gaan, komen, willen, kunnen, moeten), use the correct irregular present-tense forms.
For regular verbs, apply standard Dutch conjugation rules: stem for ik, stem+t for jij/u/hij/zij/het, infinitive for wij/jullie/zij(pl).
```

---

## Course Pack Template

To generate a full course with multiple modules and lessons:

```
You are a Dutch language specialist. Generate a complete course pack in JSON format for a Dutch A2 learning app.

Course: [COURSE TITLE]
Modules: [LIST OF MODULE TITLES]
Lessons per module: [LIST OF LESSON TITLES PER MODULE]

For each lesson, include:
- 6-10 vocabulary items with correct de/het articles
- 6-10 sentences using vocabulary lemmas as exact whole words
- One dialog with 4-6 turns
- 2-3 verbs with full present-tense conjugation (all 9 pronouns)
- lessonVerbs links (role: target)
- sentenceVerbs links
- One writing prompt
- One grammar pattern

Use the full course pack JSON structure with manifest, courses, modules, lessons, classGroups, vocabulary, sentences, dialogs, dialogTurns, verbs, verbConjugationSets, verbConjugationForms, lessonVerbs, sentenceVerbs, grammarPatterns, writingPrompts.

All IDs must be globally unique across the entire course.
All conjugation forms must be linguistically correct Dutch.
Output ONLY valid JSON.
```
