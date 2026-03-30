import type { AppDatabase } from './index';
import { courses, modules, lessons, classGroups } from './schema/courses';
import { vocabularyItems, sentenceItems, dialogs, dialogTurns } from './schema/content';
import { grammarPatterns } from './schema/grammar';
import { writingPrompts } from './schema/writing';

/**
 * Seed the database with sample Dutch A2 content for testing.
 * Only runs if no courses exist yet.
 */
export function seedIfEmpty(db: AppDatabase) {
  const existing = db.select().from(courses).all();
  if (existing.length > 0) return false;

  seed(db);
  return true;
}

export function seed(db: AppDatabase) {
  // --- Course ---
  db.insert(courses).values({
    id: 'course-1',
    title: 'Nederlands A2 - Inburgering',
    description: 'Dutch naturalization exam preparation course',
    targetLevel: 'A2',
    languageCode: 'nl',
    version: '1.0',
  }).run();

  // --- Modules ---
  db.insert(modules).values([
    { id: 'mod-1', courseId: 'course-1', title: 'Dagelijks Leven (Daily Life)', orderIndex: 0 },
    { id: 'mod-2', courseId: 'course-1', title: 'Gezondheid (Health)', orderIndex: 1 },
  ]).run();

  // ============================================
  // MODULE 1: Daily Life
  // ============================================

  // --- Lesson 1: Bij de bakker (At the bakery) ---
  db.insert(lessons).values({
    id: 'les-1',
    moduleId: 'mod-1',
    title: 'Bij de bakker',
    description: 'Learn vocabulary for shopping at the bakery',
    orderIndex: 0,
    estimatedMinutes: 15,
  }).run();

  db.insert(classGroups).values([
    { id: 'cg-1a', lessonId: 'les-1', type: 'vocabulary', title: 'Woordenschat', orderIndex: 0 },
    { id: 'cg-1b', lessonId: 'les-1', type: 'dialog', title: 'Dialoog', orderIndex: 1 },
    { id: 'cg-1c', lessonId: 'les-1', type: 'grammar', title: 'Grammatica', orderIndex: 2 },
    { id: 'cg-1d', lessonId: 'les-1', type: 'writing', title: 'Schrijven', orderIndex: 3 },
  ]).run();

  db.insert(vocabularyItems).values([
    { id: 'v-1', lemma: 'brood', displayText: 'het brood', article: 'het', partOfSpeech: 'noun', translation: 'bread', classGroupId: 'cg-1a', difficulty: 1.0 },
    { id: 'v-2', lemma: 'kaas', displayText: 'de kaas', article: 'de', partOfSpeech: 'noun', translation: 'cheese', classGroupId: 'cg-1a', difficulty: 1.0 },
    { id: 'v-3', lemma: 'melk', displayText: 'de melk', article: 'de', partOfSpeech: 'noun', translation: 'milk', classGroupId: 'cg-1a', difficulty: 1.0 },
    { id: 'v-4', lemma: 'koekje', displayText: 'het koekje', article: 'het', partOfSpeech: 'noun', translation: 'cookie', classGroupId: 'cg-1a', difficulty: 1.0 },
    { id: 'v-5', lemma: 'taart', displayText: 'de taart', article: 'de', partOfSpeech: 'noun', translation: 'cake', classGroupId: 'cg-1a', difficulty: 1.2 },
    { id: 'v-6', lemma: 'betalen', displayText: 'betalen', article: null, partOfSpeech: 'verb', translation: 'to pay', classGroupId: 'cg-1a', difficulty: 1.3 },
    { id: 'v-7', lemma: 'kopen', displayText: 'kopen', article: null, partOfSpeech: 'verb', translation: 'to buy', classGroupId: 'cg-1a', difficulty: 1.2 },
    { id: 'v-8', lemma: 'graag', displayText: 'graag', article: null, partOfSpeech: 'adverb', translation: 'gladly / please', classGroupId: 'cg-1a', difficulty: 1.0 },
  ]).run();

  db.insert(sentenceItems).values([
    { id: 's-1', text: 'Ik wil graag een brood kopen.', translation: 'I would like to buy a bread.', lessonId: 'les-1', classGroupId: 'cg-1a' },
    { id: 's-2', text: 'Hoeveel kost de kaas?', translation: 'How much does the cheese cost?', lessonId: 'les-1', classGroupId: 'cg-1a' },
    { id: 's-3', text: 'Mag ik een koekje alstublieft?', translation: 'May I have a cookie please?', lessonId: 'les-1', classGroupId: 'cg-1a' },
    { id: 's-4', text: 'Ik wil met de pinpas betalen.', translation: 'I want to pay with a debit card.', lessonId: 'les-1', classGroupId: 'cg-1a' },
    { id: 's-5', text: 'De taart is heel lekker.', translation: 'The cake is very tasty.', lessonId: 'les-1', classGroupId: 'cg-1a' },
    { id: 's-6', text: 'Wij drinken elke ochtend melk.', translation: 'We drink milk every morning.', lessonId: 'les-1', classGroupId: 'cg-1a' },
  ]).run();

  db.insert(dialogs).values({
    id: 'd-1',
    lessonId: 'les-1',
    title: 'Bij de bakker',
    scenario: 'Buying bread and cake at the bakery',
    classGroupId: 'cg-1b',
  }).run();

  db.insert(dialogTurns).values([
    { id: 'dt-1', dialogId: 'd-1', speaker: 'Bakker', text: 'Goedemorgen! Wat mag het zijn?', translation: 'Good morning! What can I get you?', orderIndex: 0 },
    { id: 'dt-2', dialogId: 'd-1', speaker: 'Klant', text: 'Goedemorgen. Ik wil graag een brood.', translation: 'Good morning. I would like a bread.', orderIndex: 1 },
    { id: 'dt-3', dialogId: 'd-1', speaker: 'Bakker', text: 'Wit of bruin?', translation: 'White or brown?', orderIndex: 2 },
    { id: 'dt-4', dialogId: 'd-1', speaker: 'Klant', text: 'Bruin, alstublieft. En een stuk taart.', translation: 'Brown, please. And a piece of cake.', orderIndex: 3 },
    { id: 'dt-5', dialogId: 'd-1', speaker: 'Bakker', text: 'Dat is vijf euro vijftig.', translation: 'That is five euros fifty.', orderIndex: 4 },
    { id: 'dt-6', dialogId: 'd-1', speaker: 'Klant', text: 'Kan ik met de pinpas betalen?', translation: 'Can I pay with a debit card?', orderIndex: 5 },
  ]).run();

  db.insert(grammarPatterns).values({
    id: 'gp-1',
    name: 'Ik wil graag + infinitief',
    description: 'Polite request pattern: "I would like to..."',
    explanationMarkdown: '**Ik wil graag** + infinitief aan het eind.\n\nVoorbeelden:\n- Ik wil graag een brood **kopen**.\n- Ik wil graag met de pinpas **betalen**.',
    examples: JSON.stringify(['Ik wil graag koffie drinken.', 'Ik wil graag een afspraak maken.']),
    lessonId: 'les-1',
  }).run();

  db.insert(writingPrompts).values({
    id: 'wp-1',
    lessonId: 'les-1',
    promptText: 'Write a short message to a friend. Tell them what you bought at the bakery today.',
    targetPatterns: JSON.stringify(['Ik wil graag', 'kopen', 'betalen']),
    expectedKeywords: JSON.stringify(['brood', 'bakker', 'kopen', 'betalen', 'lekker']),
    difficulty: 1.0,
  }).run();

  // --- Lesson 2: Op de markt (At the market) ---
  db.insert(lessons).values({
    id: 'les-2',
    moduleId: 'mod-1',
    title: 'Op de markt',
    description: 'Learn vocabulary for shopping at the market',
    orderIndex: 1,
    estimatedMinutes: 15,
  }).run();

  db.insert(classGroups).values([
    { id: 'cg-2a', lessonId: 'les-2', type: 'vocabulary', title: 'Woordenschat', orderIndex: 0 },
    { id: 'cg-2b', lessonId: 'les-2', type: 'dialog', title: 'Dialoog', orderIndex: 1 },
  ]).run();

  db.insert(vocabularyItems).values([
    { id: 'v-9', lemma: 'appel', displayText: 'de appel', article: 'de', partOfSpeech: 'noun', translation: 'apple', classGroupId: 'cg-2a', difficulty: 1.0 },
    { id: 'v-10', lemma: 'tomaat', displayText: 'de tomaat', article: 'de', partOfSpeech: 'noun', translation: 'tomato', classGroupId: 'cg-2a', difficulty: 1.0 },
    { id: 'v-11', lemma: 'vis', displayText: 'de vis', article: 'de', partOfSpeech: 'noun', translation: 'fish', classGroupId: 'cg-2a', difficulty: 1.0 },
    { id: 'v-12', lemma: 'groente', displayText: 'de groente', article: 'de', partOfSpeech: 'noun', translation: 'vegetable', classGroupId: 'cg-2a', difficulty: 1.1 },
    { id: 'v-13', lemma: 'fruit', displayText: 'het fruit', article: 'het', partOfSpeech: 'noun', translation: 'fruit', classGroupId: 'cg-2a', difficulty: 1.0 },
    { id: 'v-14', lemma: 'goedkoop', displayText: 'goedkoop', article: null, partOfSpeech: 'adjective', translation: 'cheap', classGroupId: 'cg-2a', difficulty: 1.2 },
    { id: 'v-15', lemma: 'duur', displayText: 'duur', article: null, partOfSpeech: 'adjective', translation: 'expensive', classGroupId: 'cg-2a', difficulty: 1.1 },
  ]).run();

  db.insert(sentenceItems).values([
    { id: 's-7', text: 'De appel is goedkoop vandaag.', translation: 'The apple is cheap today.', lessonId: 'les-2', classGroupId: 'cg-2a' },
    { id: 's-8', text: 'Ik koop graag vis op de markt.', translation: 'I like to buy fish at the market.', lessonId: 'les-2', classGroupId: 'cg-2a' },
    { id: 's-9', text: 'De groente is heel vers.', translation: 'The vegetables are very fresh.', lessonId: 'les-2', classGroupId: 'cg-2a' },
    { id: 's-10', text: 'Het fruit is niet duur.', translation: 'The fruit is not expensive.', lessonId: 'les-2', classGroupId: 'cg-2a' },
    { id: 's-11', text: 'Mag ik twee kilo tomaat?', translation: 'May I have two kilos of tomatoes?', lessonId: 'les-2', classGroupId: 'cg-2a' },
  ]).run();

  db.insert(dialogs).values({
    id: 'd-2',
    lessonId: 'les-2',
    title: 'Op de markt',
    scenario: 'Buying fruit and vegetables at the market',
    classGroupId: 'cg-2b',
  }).run();

  db.insert(dialogTurns).values([
    { id: 'dt-7', dialogId: 'd-2', speaker: 'Verkoper', text: 'Goedemiddag! Kan ik u helpen?', translation: 'Good afternoon! Can I help you?', orderIndex: 0 },
    { id: 'dt-8', dialogId: 'd-2', speaker: 'Klant', text: 'Ja, ik zoek verse tomaat.', translation: 'Yes, I am looking for fresh tomatoes.', orderIndex: 1 },
    { id: 'dt-9', dialogId: 'd-2', speaker: 'Verkoper', text: 'Deze zijn heel lekker. Twee euro per kilo.', translation: 'These are very tasty. Two euros per kilo.', orderIndex: 2 },
    { id: 'dt-10', dialogId: 'd-2', speaker: 'Klant', text: 'Dat is goedkoop! Twee kilo alstublieft.', translation: 'That is cheap! Two kilos please.', orderIndex: 3 },
  ]).run();

  // ============================================
  // MODULE 2: Health
  // ============================================

  db.insert(lessons).values({
    id: 'les-3',
    moduleId: 'mod-2',
    title: 'Bij de dokter',
    description: 'Learn vocabulary for visiting the doctor',
    orderIndex: 0,
    estimatedMinutes: 20,
  }).run();

  db.insert(classGroups).values([
    { id: 'cg-3a', lessonId: 'les-3', type: 'vocabulary', title: 'Woordenschat', orderIndex: 0 },
    { id: 'cg-3b', lessonId: 'les-3', type: 'dialog', title: 'Dialoog', orderIndex: 1 },
    { id: 'cg-3c', lessonId: 'les-3', type: 'grammar', title: 'Grammatica', orderIndex: 2 },
    { id: 'cg-3d', lessonId: 'les-3', type: 'writing', title: 'Schrijven', orderIndex: 3 },
  ]).run();

  db.insert(vocabularyItems).values([
    { id: 'v-16', lemma: 'dokter', displayText: 'de dokter', article: 'de', partOfSpeech: 'noun', translation: 'doctor', classGroupId: 'cg-3a', difficulty: 1.0 },
    { id: 'v-17', lemma: 'afspraak', displayText: 'de afspraak', article: 'de', partOfSpeech: 'noun', translation: 'appointment', classGroupId: 'cg-3a', difficulty: 1.2 },
    { id: 'v-18', lemma: 'ziek', displayText: 'ziek', article: null, partOfSpeech: 'adjective', translation: 'sick', classGroupId: 'cg-3a', difficulty: 1.0 },
    { id: 'v-19', lemma: 'hoofdpijn', displayText: 'de hoofdpijn', article: 'de', partOfSpeech: 'noun', translation: 'headache', classGroupId: 'cg-3a', difficulty: 1.3 },
    { id: 'v-20', lemma: 'medicijn', displayText: 'het medicijn', article: 'het', partOfSpeech: 'noun', translation: 'medicine', classGroupId: 'cg-3a', difficulty: 1.4 },
    { id: 'v-21', lemma: 'pijn', displayText: 'de pijn', article: 'de', partOfSpeech: 'noun', translation: 'pain', classGroupId: 'cg-3a', difficulty: 1.1 },
    { id: 'v-22', lemma: 'recept', displayText: 'het recept', article: 'het', partOfSpeech: 'noun', translation: 'prescription', classGroupId: 'cg-3a', difficulty: 1.5 },
    { id: 'v-23', lemma: 'apotheek', displayText: 'de apotheek', article: 'de', partOfSpeech: 'noun', translation: 'pharmacy', classGroupId: 'cg-3a', difficulty: 1.3 },
  ]).run();

  db.insert(sentenceItems).values([
    { id: 's-12', text: 'Ik wil graag een afspraak maken bij de dokter.', translation: 'I would like to make an appointment with the doctor.', lessonId: 'les-3', classGroupId: 'cg-3a' },
    { id: 's-13', text: 'Ik ben ziek en heb hoofdpijn.', translation: 'I am sick and have a headache.', lessonId: 'les-3', classGroupId: 'cg-3a' },
    { id: 's-14', text: 'De dokter geeft mij een recept voor medicijn.', translation: 'The doctor gives me a prescription for medicine.', lessonId: 'les-3', classGroupId: 'cg-3a' },
    { id: 's-15', text: 'Ik haal het medicijn bij de apotheek.', translation: 'I pick up the medicine at the pharmacy.', lessonId: 'les-3', classGroupId: 'cg-3a' },
    { id: 's-16', text: 'Ik heb veel pijn in mijn rug.', translation: 'I have a lot of pain in my back.', lessonId: 'les-3', classGroupId: 'cg-3a' },
    { id: 's-17', text: 'Kunt u mij helpen? Ik voel mij niet goed.', translation: 'Can you help me? I do not feel well.', lessonId: 'les-3', classGroupId: 'cg-3a' },
  ]).run();

  db.insert(dialogs).values({
    id: 'd-3',
    lessonId: 'les-3',
    title: 'Bij de huisarts',
    scenario: 'Visiting the family doctor with a health complaint',
    classGroupId: 'cg-3b',
  }).run();

  db.insert(dialogTurns).values([
    { id: 'dt-11', dialogId: 'd-3', speaker: 'Receptionist', text: 'Goedemorgen, huisartsenpraktijk De Laan.', translation: 'Good morning, De Laan family practice.', orderIndex: 0 },
    { id: 'dt-12', dialogId: 'd-3', speaker: 'Patiënt', text: 'Goedemorgen. Ik wil graag een afspraak maken.', translation: 'Good morning. I would like to make an appointment.', orderIndex: 1 },
    { id: 'dt-13', dialogId: 'd-3', speaker: 'Receptionist', text: 'Wat zijn uw klachten?', translation: 'What are your complaints?', orderIndex: 2 },
    { id: 'dt-14', dialogId: 'd-3', speaker: 'Patiënt', text: 'Ik heb al drie dagen hoofdpijn en ik voel mij ziek.', translation: 'I have had a headache for three days and I feel sick.', orderIndex: 3 },
    { id: 'dt-15', dialogId: 'd-3', speaker: 'Receptionist', text: 'Kunt u morgenochtend om negen uur komen?', translation: 'Can you come tomorrow morning at nine o\'clock?', orderIndex: 4 },
    { id: 'dt-16', dialogId: 'd-3', speaker: 'Patiënt', text: 'Ja, dat is goed. Dank u wel.', translation: 'Yes, that is fine. Thank you.', orderIndex: 5 },
  ]).run();

  db.insert(grammarPatterns).values({
    id: 'gp-2',
    name: 'Ik heb + tijdsbepaling + klacht',
    description: 'Describing how long you have had a symptom',
    explanationMarkdown: '**Ik heb** + tijdsbepaling + klacht.\n\nVoorbeelden:\n- Ik heb **al drie dagen** hoofdpijn.\n- Ik heb **sinds gisteren** koorts.',
    examples: JSON.stringify(['Ik heb al een week pijn.', 'Ik heb sinds maandag koorts.']),
    lessonId: 'les-3',
  }).run();

  db.insert(writingPrompts).values({
    id: 'wp-2',
    lessonId: 'les-3',
    promptText: 'Write a short message to your teacher. Say that you are sick and cannot come to class tomorrow. Explain what is wrong.',
    targetPatterns: JSON.stringify(['Ik ben ziek', 'Ik kan niet komen', 'hoofdpijn']),
    expectedKeywords: JSON.stringify(['ziek', 'niet', 'komen', 'morgen', 'dokter', 'hoofdpijn']),
    difficulty: 1.2,
  }).run();
}
