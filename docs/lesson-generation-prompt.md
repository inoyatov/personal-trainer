# Lesson Generation Guide for Dutch A2 Exam Preparation App

## Overview

You are generating structured JSON lesson content for a Dutch language learning desktop application. The app teaches vocabulary, grammar, and writing through contextual exercises for the Dutch naturalization (inburgering) exam at A2 level.

The app supports two JSON formats:
1. **Course Pack** — a full course with modules and lessons
2. **Lesson Pack** — a single lesson that can be imported into an existing module

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

### Sentences

Each sentence demonstrates vocabulary in context. The app creates gap-fill exercises by finding vocabulary words in sentences and blanking them out.

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
3. Aim for **4-8 sentences** per lesson.
4. Keep sentences at A2 level: short, clear, practical.
5. Use realistic daily-life scenarios relevant to the Dutch naturalization exam.

**Example of correct matching:**
- Vocab lemma: `brood` → Sentence: "Ik wil graag een **brood** kopen." ✅
- Vocab lemma: `kopen` → Sentence: "Ik wil graag een brood **kopen**." ✅
- Vocab lemma: `afspraak` → Sentence: "Ik heb een **afspraak** bij de dokter." ✅

**Example of BROKEN matching (avoid these):**
- Vocab lemma: `betaling` → Sentence: "Ik betaal met de pinpas." ❌ (`betaling` ≠ `betaal`)
- Vocab lemma: `kopen` → Sentence: "Ik heb het gekocht." ❌ (conjugated form `gekocht` ≠ `kopen`)

### Dialogs

Dialogs are short conversations (4-8 turns) that model real-life Dutch interactions.

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

Each turn is one speaker's line in a dialog. The app creates exercises by blanking out a keyword from a turn and showing prior turns as context.

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
| `speaker` | string | yes | Speaker name/role (e.g., "Dokter", "Patiënt", "Verkoper", "Klant") |
| `text` | string | yes | The Dutch text of this turn. Should contain content words (3+ letters) for gap-fill. |
| `translation` | string | yes | English translation |
| `orderIndex` | number | yes | 0-based turn order |

**Guidelines:**
- Use **2 speakers** per dialog
- **4-6 turns** is ideal
- The first turn (orderIndex: 0) is context-only and won't be used for exercises
- Use content words (nouns, verbs, adjectives of 3+ letters) in turns — very short function words (de, het, ik, je, en, of) are automatically skipped
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

### Writing Prompts (optional)

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

Note: `targetPatterns` and `expectedKeywords` are **JSON strings** containing JSON arrays.

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
  "writingPrompts": []
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
2. Create 4-8 sentences where EACH sentence contains at least one vocabulary lemma as an exact whole word
3. Create one dialog with 4-6 turns between two speakers
4. Use the exact JSON structure from the specification
5. All IDs must be unique using the pattern: v-{topic}-{n}, s-{topic}-{n}, etc.
6. Keep all Dutch text at A2 level
7. Every vocabulary lemma must appear in at least one sentence
8. Set classGroupId references correctly
9. Output ONLY the JSON, no explanation

Topic: [TOPIC]
Lesson ID prefix: les-[topic-slug]
```
