import type { Migration } from '../types';
import { migration as v002 } from './v002_extend_review_states';
import { migration as v003 } from './v003_add_confidence';
import { migration as v004 } from './v004_add_verb_conjugation';
import { migration as v005 } from './v005_add_normalized_word';
import { migration as v006 } from './v006_session_status';
import { migration as v007 } from './v007_extend_session_modes';

/** All migrations in order. The runner applies those with version > current. */
export const allMigrations: Migration[] = [v002, v003, v004, v005, v006, v007];

/** The target schema version (latest migration version) */
export const TARGET_VERSION = 7;
