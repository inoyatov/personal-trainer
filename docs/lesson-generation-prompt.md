# Lesson Generation Guide for Dutch A2 Exam Preparation App

## Overview

You are generating structured JSON lesson content for a Dutch language learning desktop application. The app teaches vocabulary, grammar, and writing through contextual exercises for the Dutch naturalization (inburgering) exam at A2 level.

The app supports two JSON formats:
1. **Course Pack** — a full course with modules and lessons
2. **Lesson Pack** — a single lesson that can be imported into an existing module

### Exercise Types Generated from Content

The app automatically generates these exercise types from your content:

| Exercise | Source | How It Works |
|----------|--------|-------------|
| **Multiple-choice gap-fill** | Sentences + vocabulary | Blanks a vocabulary word in a sentence, offers 4 options |
| **Typed gap-fill** | Sentences + vocabulary | Same blank, user types the answer (with typo tolerance) |
| **Word order** | Sentences | Scrambles sentence words, user clicks to reorder |
| **Dialog completion** | Dialog turns | Blanks a keyword in a dialog turn, shows prior turns as context |
| **Guided writing** | Writing prompts | Free-text writing with keyword/pattern feedback |

### Study Modes

Users can choose study intensity:
- **Low Energy** (5-10 min): MC only, 8 exercises, no new items
- **Normal** (15-20 min): MC + typed + dialog, 15 exercises
- **Deep** (30+ min): All types including word order, 25 exercises

More varied content = better exercise variety across all modes.

---

## Format 1: Lesson Pack (Single Lesson)

Use this format when adding individual lessons to an existing course.

```json
{
  "lesson": {
    "id": "les-UNIQUE-ID",
    "moduleId": "ignored-on-import",
    "title": "Lesson Title in Dutch (English Translation)",
    "description": "Brief description of what the learner will study",
    "orderIndex": 0,
    "estimatedMinutes": 15
  },
  "classGroups": [
    {
      "id": "cg-UNIQUE-vocab",
      "lessonId": "les-UNIQUE-ID",
      "type": "vocabulary",
      "title": "Woordenschat",
      "orderIndex": 0
    },
    {
      "id": "cg-UNIQUE-dialog",
      "lessonId": "les-UNIQUE-ID",
      "type": "dialog",
      "title": "Dialoog",
      "orderIndex": 1
    },
    {
      "id": "cg-UNIQUE-grammar",
      "lessonId": "les-UNIQUE-ID",
      "type": "grammar",
      "title": "Grammatica",
      "orderIndex": 2
    },
    {
      "id": "cg-UNIQUE-writing",
      "lessonId": "les-UNIQUE-ID",
      "type": "writing",
      "title": "Schrijven",
      "orderIndex": 3
    }
  ],
  "vocabulary": [ ... ],
  "sentences": [ ... ],
  "dialogs": [ ... ],
  "dialogTurns": [ ... ],
  "grammarPatterns": [ ... ],
  "writingPrompts": [ ... ]
}
```

### Field: `lesson.moduleId`
Set to any string — it will be overridden when the user imports the lesson into a specific module.

---

## Format 2: Course Pack (Full Course)

Use this format to create an entire course from scratch.

```json
{
  "manifest": {
    "name": "Course Title",
    "version": "1.0",
    "description": "Course description",
    "author": "Your Name",
    "createdAt": "2026-01-01T00:00:00.000Z"
  },
  "courses": [
    {
      "id": "course-UNIQUE",
      "title": "Course Title",
      "description": "Course description",
      "targetLevel": "A2",
      "languageCode": "nl",
      "version": "1.0"
    }
  ],
  "modules": [
    {
      "id": "mod-UNIQUE",
      "courseId": "course-UNIQUE",
      "title": "Module Title",
      "orderIndex": 0
    }
  ],
  "lessons": [ ... ],
  "classGroups": [ ... ],
  "vocabulary": [ ... ],
  "sentences": [ ... ],
  "dialogs": [ ... ],
  "dialogTurns": [ ... ],
  "grammarPatterns": [ ... ],
  "writingPrompts": [ ... ]
}
```

---

## Entity Specifications

### Vocabulary Items

Each vocabulary item represents a single Dutch word or expression.

```json
{
  "id": "v-UNIQUE",
  "lemma": "afspraak",
  "displayText": "de afspraak",
  "article": "de",
  "partOfSpeech": "noun",
  "translation": "appointment",
  "classGroupId": "cg-UNIQUE-vocab",
  "difficulty": 1.0
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Globally unique ID. Use pattern: `v-TOPIC-NUMBER` (e.g., `v-dokter-1`) |
| `lemma` | string | yes | The base form of the word (no article). Used for gap-fill matching in sentences. |
| `displayText` | string | yes | How the word is displayed to the learner, typically with article (e.g., "de dokter") |
| `article` | string or null | no | Dutch article: `"de"`, `"het"`, `"een"`, or `null` for verbs/adjectives/adverbs |
| `partOfSpeech` | string | yes | One of: `"noun"`, `"verb"`, `"adjective"`, `"adverb"`, `"preposition"`, `"conjunction"` |
| `translation` | string | yes | English translation |
| `classGroupId` | string or null | no | ID of the vocabulary class group in this lesson |
| `difficulty` | number | no | 1.0 = easy, up to 2.0 = hard. Default: 1.0 |

**Guidelines:**
- Aim for **6-10 vocabulary items** per lesson
- Mix nouns (with articles), verbs, and adjectives
- Include common A2-level words relevant to the topic
- The `lemma` MUST appear exactly (case-insensitive) in at least one sentence for exercises to work
- Distractors for MC exercises are automatically selected from other vocabulary items in the same lesson (preferring same part of speech), so include enough variety

### Sentences

Each sentence demonstrates vocabulary in context. The app creates **three** exercise types from sentences:

1. **Gap-fill** (MC and typed): blanks a vocabulary word, user selects or types it
2. **Word order**: scrambles sentence words, user clicks to reorder them
3. **Review exercises**: due sentences are used for review gap-fill sessions

```json
{
  "id": "s-UNIQUE",
  "text": "Ik wil graag een afspraak maken.",
  "translation": "I would like to make an appointment.",
  "lessonId": "les-UNIQUE-ID",
  "classGroupId": "cg-UNIQUE-vocab"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique ID. Use pattern: `s-TOPIC-NUMBER` |
| `text` | string | yes | Dutch sentence. MUST contain at least one vocabulary `lemma` word exactly as spelled. |
| `translation` | string | yes | English translation |
| `lessonId` | string | yes | Must match the lesson ID |
| `classGroupId` | string or null | no | ID of the class group |

**CRITICAL RULES:**
1. **Every sentence MUST contain at least one vocabulary lemma as a whole word.** The app uses `\bword\b` regex matching. If the lemma is "brood", the sentence must contain "brood" as a standalone word (not inside another word).
2. **Every vocabulary item SHOULD appear in at least one sentence.** Otherwise it won't generate exercises.
3. Aim for **6-10 sentences** per lesson (more sentences = more word order exercises in Deep mode).
4. Keep sentences at A2 level: short, clear, practical.
5. Use realistic daily-life scenarios relevant to the Dutch naturalization exam.
6. **For word order exercises**: sentences with 4-8 words work best. Very short sentences (< 3 words) are skipped.

**Example of correct matching:**
- Vocab lemma: `brood` → Sentence: "Ik wil graag een **brood** kopen." ✅
- Vocab lemma: `kopen` → Sentence: "Ik wil graag een brood **kopen**." ✅
- Vocab lemma: `afspraak` → Sentence: "Ik heb een **afspraak** bij de dokter." ✅

**Example of BROKEN matching (avoid these):**
- Vocab lemma: `betaling` → Sentence: "Ik betaal met de pinpas." ❌ (`betaling` ≠ `betaal`)
- Vocab lemma: `kopen` → Sentence: "Ik heb het gekocht." ❌ (conjugated form `gekocht` ≠ `kopen`)

### Dialogs

Dialogs are short conversations (4-8 turns) that model real-life Dutch interactions. The app creates **dialog completion exercises** by blanking a keyword from a turn and showing prior turns as context in a chat-bubble UI.

```json
{
  "id": "d-UNIQUE",
  "lessonId": "les-UNIQUE-ID",
  "title": "Dialog Title",
  "scenario": "Brief description of the situation",
  "classGroupId": "cg-UNIQUE-dialog"
}
```

### Dialog Turns

Each turn is one speaker's line in a dialog.

```json
{
  "id": "dt-UNIQUE",
  "dialogId": "d-UNIQUE",
  "speaker": "Dokter",
  "text": "Goedemorgen, wat kan ik voor u doen?",
  "translation": "Good morning, what can I do for you?",
  "orderIndex": 0
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique ID |
| `dialogId` | string | yes | Must match the dialog ID |
| `speaker` | string | yes | Speaker name/role (e.g., "Dokter", "Patient", "Verkoper", "Klant") |
| `text` | string | yes | The Dutch text of this turn. Should contain content words (3+ letters) for gap-fill. |
| `translation` | string | yes | English translation |
| `orderIndex` | number | yes | 0-based turn order |

**Guidelines:**
- Use **2 speakers** per dialog
- **4-6 turns** is ideal (the app generates up to 3 exercises per dialog)
- The first turn (orderIndex: 0) is context-only and won't be used for exercises
- Use content words (nouns, verbs, adjectives of 3+ letters) in turns — short function words (de, het, ik, je, en, of, in, op, is, dat, er, ja, nee, met, van, voor, naar, aan, om, al, ook, nog, maar, dan, wel, niet, kan, dit, die, wat, hoe) are automatically skipped when selecting a target word
- **Longer content words** are preferred as targets — the app picks the longest content words first
- Make the dialog realistic and exam-relevant

### Grammar Patterns (optional)

```json
{
  "id": "gp-UNIQUE",
  "name": "Pattern name",
  "description": "Brief description",
  "explanationMarkdown": "**Pattern** explanation with examples.\n\n- Example 1\n- Example 2",
  "examples": "[\"Example sentence 1\", \"Example sentence 2\"]",
  "lessonId": "les-UNIQUE-ID"
}
```

Note: `examples` is a **JSON string** containing a JSON array, not a raw array.

### Writing Prompts (optional but recommended)

Writing prompts enable the Writing Lab feature. The app evaluates submissions using 7 heuristic checks: non-empty, minimum length (5+ words), capitalization, punctuation, keyword coverage (>=50%), target pattern usage, and sentence structure.

```json
{
  "id": "wp-UNIQUE",
  "lessonId": "les-UNIQUE-ID",
  "promptText": "Write a short message to your neighbor. Introduce yourself and say when you moved in.",
  "targetPatterns": "[\"Ik heet\", \"Ik woon\", \"verhuisd\"]",
  "expectedKeywords": "[\"hallo\", \"naam\", \"wonen\", \"verhuizen\", \"buren\"]",
  "difficulty": 1.0
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `promptText` | string | yes | The writing task in English. Should ask for 2-4 sentences. |
| `targetPatterns` | JSON string | no | Sentence patterns the learner should try to use. Array of strings. |
| `expectedKeywords` | JSON string | no | Dutch words the learner should include. 3-6 keywords is ideal. More keywords = stricter scoring. |
| `difficulty` | number | no | 1.0 = easy, 2.0 = hard. Default: 1.0 |

Note: `targetPatterns` and `expectedKeywords` are **JSON strings** containing JSON arrays.

**Writing prompt tips:**
- A2-level tasks: simple email, short message, form response, excuse/explanation, invitation
- Include 3-6 expected keywords that a good answer would naturally contain
- Include 1-3 target patterns (sentence starters or chunks)
- Lessons with writing prompts require a writing submission for lesson completion

---

## ID Naming Convention

All IDs must be globally unique. Use this pattern:

| Entity | Pattern | Example |
|--------|---------|---------|
| Course | `course-{topic}` | `course-gezondheid` |
| Module | `mod-{topic}` | `mod-bij-de-dokter` |
| Lesson | `les-{topic}` | `les-apotheek` |
| Class Group | `cg-{lesson}-{type}` | `cg-apotheek-vocab` |
| Vocabulary | `v-{lesson}-{number}` | `v-apotheek-1` |
| Sentence | `s-{lesson}-{number}` | `s-apotheek-1` |
| Dialog | `d-{lesson}` | `d-apotheek` |
| Dialog Turn | `dt-{lesson}-{number}` | `dt-apotheek-1` |
| Grammar | `gp-{lesson}-{number}` | `gp-apotheek-1` |
| Writing Prompt | `wp-{lesson}` | `wp-apotheek` |

---

## Complete Lesson Pack Example

Here is a complete, valid lesson pack for the topic "At the pharmacy":

```json
{
  "lesson": {
    "id": "les-apotheek",
    "moduleId": "will-be-overridden",
    "title": "Bij de apotheek (At the pharmacy)",
    "description": "Learn vocabulary for visiting the pharmacy",
    "orderIndex": 0,
    "estimatedMinutes": 15
  },
  "classGroups": [
    {
      "id": "cg-apotheek-vocab",
      "lessonId": "les-apotheek",
      "type": "vocabulary",
      "title": "Woordenschat",
      "orderIndex": 0
    },
    {
      "id": "cg-apotheek-dialog",
      "lessonId": "les-apotheek",
      "type": "dialog",
      "title": "Dialoog",
      "orderIndex": 1
    },
    {
      "id": "cg-apotheek-writing",
      "lessonId": "les-apotheek",
      "type": "writing",
      "title": "Schrijven",
      "orderIndex": 2
    }
  ],
  "vocabulary": [
    {
      "id": "v-apotheek-1",
      "lemma": "apotheek",
      "displayText": "de apotheek",
      "article": "de",
      "partOfSpeech": "noun",
      "translation": "pharmacy",
      "classGroupId": "cg-apotheek-vocab",
      "difficulty": 1.0
    },
    {
      "id": "v-apotheek-2",
      "lemma": "medicijn",
      "displayText": "het medicijn",
      "article": "het",
      "partOfSpeech": "noun",
      "translation": "medicine",
      "classGroupId": "cg-apotheek-vocab",
      "difficulty": 1.2
    },
    {
      "id": "v-apotheek-3",
      "lemma": "recept",
      "displayText": "het recept",
      "article": "het",
      "partOfSpeech": "noun",
      "translation": "prescription",
      "classGroupId": "cg-apotheek-vocab",
      "difficulty": 1.3
    },
    {
      "id": "v-apotheek-4",
      "lemma": "pijn",
      "displayText": "de pijn",
      "article": "de",
      "partOfSpeech": "noun",
      "translation": "pain",
      "classGroupId": "cg-apotheek-vocab",
      "difficulty": 1.0
    },
    {
      "id": "v-apotheek-5",
      "lemma": "tablet",
      "displayText": "de tablet",
      "article": "de",
      "partOfSpeech": "noun",
      "translation": "tablet/pill",
      "classGroupId": "cg-apotheek-vocab",
      "difficulty": 1.1
    },
    {
      "id": "v-apotheek-6",
      "lemma": "slikken",
      "displayText": "slikken",
      "article": null,
      "partOfSpeech": "verb",
      "translation": "to swallow (take medicine)",
      "classGroupId": "cg-apotheek-vocab",
      "difficulty": 1.4
    }
  ],
  "sentences": [
    {
      "id": "s-apotheek-1",
      "text": "Ik haal mijn medicijn bij de apotheek.",
      "translation": "I pick up my medicine at the pharmacy.",
      "lessonId": "les-apotheek",
      "classGroupId": "cg-apotheek-vocab"
    },
    {
      "id": "s-apotheek-2",
      "text": "Heeft u een recept van de dokter?",
      "translation": "Do you have a prescription from the doctor?",
      "lessonId": "les-apotheek",
      "classGroupId": "cg-apotheek-vocab"
    },
    {
      "id": "s-apotheek-3",
      "text": "Ik heb veel pijn in mijn hoofd.",
      "translation": "I have a lot of pain in my head.",
      "lessonId": "les-apotheek",
      "classGroupId": "cg-apotheek-vocab"
    },
    {
      "id": "s-apotheek-4",
      "text": "U moet drie keer per dag een tablet slikken.",
      "translation": "You must swallow a tablet three times a day.",
      "lessonId": "les-apotheek",
      "classGroupId": "cg-apotheek-vocab"
    },
    {
      "id": "s-apotheek-5",
      "text": "Dit medicijn is zonder recept verkrijgbaar.",
      "translation": "This medicine is available without a prescription.",
      "lessonId": "les-apotheek",
      "classGroupId": "cg-apotheek-vocab"
    },
    {
      "id": "s-apotheek-6",
      "text": "De apotheek is open van negen tot vijf.",
      "translation": "The pharmacy is open from nine to five.",
      "lessonId": "les-apotheek",
      "classGroupId": "cg-apotheek-vocab"
    }
  ],
  "dialogs": [
    {
      "id": "d-apotheek",
      "lessonId": "les-apotheek",
      "title": "Bij de apotheek",
      "scenario": "Picking up medicine at the pharmacy with a prescription",
      "classGroupId": "cg-apotheek-dialog"
    }
  ],
  "dialogTurns": [
    {
      "id": "dt-apotheek-1",
      "dialogId": "d-apotheek",
      "speaker": "Apotheker",
      "text": "Goedemiddag, kan ik u helpen?",
      "translation": "Good afternoon, can I help you?",
      "orderIndex": 0
    },
    {
      "id": "dt-apotheek-2",
      "dialogId": "d-apotheek",
      "speaker": "Klant",
      "text": "Ja, ik heb een recept van mijn dokter.",
      "translation": "Yes, I have a prescription from my doctor.",
      "orderIndex": 1
    },
    {
      "id": "dt-apotheek-3",
      "dialogId": "d-apotheek",
      "speaker": "Apotheker",
      "text": "Dit medicijn moet u twee keer per dag slikken.",
      "translation": "You must take this medicine twice a day.",
      "orderIndex": 2
    },
    {
      "id": "dt-apotheek-4",
      "dialogId": "d-apotheek",
      "speaker": "Klant",
      "text": "Heeft dit medicijn bijwerkingen?",
      "translation": "Does this medicine have side effects?",
      "orderIndex": 3
    },
    {
      "id": "dt-apotheek-5",
      "dialogId": "d-apotheek",
      "speaker": "Apotheker",
      "text": "Nee, maar neem het altijd na het eten.",
      "translation": "No, but always take it after eating.",
      "orderIndex": 4
    }
  ],
  "grammarPatterns": [],
  "writingPrompts": [
    {
      "id": "wp-apotheek",
      "lessonId": "les-apotheek",
      "promptText": "Write a short message to your teacher. Say that you are sick, you went to the pharmacy, and you have medicine. Say when you will come back to class.",
      "targetPatterns": "[\"Ik ben ziek\", \"Ik heb medicijn\", \"Ik kom\"]",
      "expectedKeywords": "[\"ziek\", \"apotheek\", \"medicijn\", \"dokter\", \"komen\", \"morgen\"]",
      "difficulty": 1.2
    }
  ]
}
```

---

## Checklist Before Submitting

Before using the generated JSON:

- [ ] Every `id` is unique across the entire file
- [ ] Every vocabulary `lemma` appears as a whole word in at least one sentence
- [ ] All `lessonId` references match the lesson's `id`
- [ ] All `classGroupId` references match a class group's `id`
- [ ] All `dialogId` references match a dialog's `id`
- [ ] Dialog turns have sequential `orderIndex` starting from 0
- [ ] Sentences are natural A2-level Dutch
- [ ] Translations are accurate
- [ ] Articles (de/het) are correct for Dutch nouns
- [ ] The JSON is valid (no trailing commas, proper quoting)
- [ ] At least 6 sentences (for word order exercise variety)
- [ ] Dialog has 4+ turns with content words (for dialog completion exercises)
- [ ] Writing prompt includes expectedKeywords and targetPatterns

---

## Suggested Topics for Dutch A2 Inburgering

Here are exam-relevant topics to generate lessons for:

**Daily Life:**
- Bij de supermarkt (At the supermarket)
- Op het postkantoor (At the post office)
- Bij de bank (At the bank)
- In het restaurant (At the restaurant)
- Op straat / de weg vragen (Asking for directions)

**Health:**
- Bij de tandarts (At the dentist)
- Bij de apotheek (At the pharmacy)
- Eerste hulp / noodgevallen (First aid / emergencies)
- Gezond eten (Healthy eating)

**Work & Education:**
- Solliciteren (Job applications)
- Op het werk (At work)
- Op school (At school)
- Bij het UWV (At the employment office)

**Government & Services:**
- Bij de gemeente (At the municipality)
- Belastingdienst (Tax office)
- Rijbewijs halen (Getting a driver's license)
- Verzekeringen (Insurance)

**Social:**
- Kennismaken (Meeting people)
- Uitnodigingen (Invitations)
- Feestdagen (Holidays)
- Buren (Neighbors)

**Housing:**
- Een huis zoeken (Looking for a house)
- Verhuizen (Moving)
- Reparaties in huis (Home repairs)
- Nutsvoorzieningen (Utilities)

**Transport:**
- Met de trein (By train)
- Met de bus (By bus)
- De fiets (Cycling)
- Autorijden (Driving)

---

## Prompt Template for ChatGPT

Use this prompt to generate a lesson:

```
Generate a Dutch A2 lesson pack in JSON format for the topic "[TOPIC]".

Follow these rules exactly:
1. Create 6-10 vocabulary items with correct de/het articles
2. Create 6-10 sentences where EACH sentence contains at least one vocabulary lemma as an exact whole word (sentences should be 4-8 words for word order exercises)
3. Create one dialog with 4-6 turns between two speakers (use longer content words in dialog turns)
4. Create one writing prompt with 3-6 expectedKeywords and 1-3 targetPatterns
5. Use the exact JSON structure from the specification
6. All IDs must be unique using the pattern: v-{topic}-{n}, s-{topic}-{n}, etc.
7. Keep all Dutch text at A2 level
8. Every vocabulary lemma must appear in at least one sentence
9. Set classGroupId references correctly
10. Include a writing classGroup with a writing prompt
11. Output ONLY the JSON, no explanation

Topic: [TOPIC]
Lesson ID prefix: les-[topic-slug]
```
