// Music Theory Engine for Double Bass Interval Trainer

export type ChordType = 'Maj7' | 'min7' | '7' | 'ø7' | 'o7';

export interface ChordDefinition {
  name: ChordType;
  fullName: string;
  symbol: string;
  intervals: number[]; // Semitone offsets from root
  chordTones: string[]; // Roman numerals for the chord tones
}

export const CHORD_DEFINITIONS: Record<ChordType, ChordDefinition> = {
  'Maj7': {
    name: 'Maj7',
    fullName: 'Major 7th',
    symbol: 'Δ',
    intervals: [0, 4, 7, 11],
    chordTones: ['I', 'III', 'V', 'VII'],
  },
  'min7': {
    name: 'min7',
    fullName: 'Minor 7th',
    symbol: '-7',
    intervals: [0, 3, 7, 10],
    chordTones: ['I', 'III', 'V', 'VII'],
  },
  '7': {
    name: '7',
    fullName: 'Dominant 7th',
    symbol: '7',
    intervals: [0, 4, 7, 10],
    chordTones: ['I', 'III', 'V', 'VII'],
  },
  'ø7': {
    name: 'ø7',
    fullName: 'Half-Diminished 7th',
    symbol: 'ø7',
    intervals: [0, 3, 6, 10],
    chordTones: ['I', 'III', 'V', 'VII'],
  },
  'o7': {
    name: 'o7',
    fullName: 'Diminished 7th',
    symbol: 'o7',
    intervals: [0, 3, 6, 9],
    chordTones: ['I', 'III', 'V', 'VII'],
  },
};

// All available chord roots
export const CHORD_ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const;
export type ChordRoot = typeof CHORD_ROOTS[number];

// Standard written MIDI pitches for open strings of double bass
// E2 (40), A2 (45), D3 (50), G3 (55)
export interface StringConfig {
  name: string;      // E, A, D, G
  openMidi: number;  // Written MIDI pitch
  thickness: number; // For visual rendering
}

export const BASS_STRINGS: StringConfig[] = [
  { name: 'G', openMidi: 55, thickness: 1.5 },
  { name: 'D', openMidi: 50, thickness: 2.2 },
  { name: 'A', openMidi: 45, thickness: 3.0 },
  { name: 'E', openMidi: 40, thickness: 4.0 },
];

// Exact spelling of pitches for each chord to maintain 100% spelling correctness.
// Key format: "Root_ChordType"
// Value: array of 4 spelled notes corresponding to chord tones [I, III, V, VII]
const CHORD_SPELLINGS: Record<string, string[]> = {
  'C_Maj7': ['C', 'E', 'G', 'B'],
  'C_min7': ['C', 'Eb', 'G', 'Bb'],
  'C_7': ['C', 'E', 'G', 'Bb'],
  'C_ø7': ['C', 'Eb', 'Gb', 'Bb'],
  'C_o7': ['C', 'Eb', 'Gb', 'A'],

  'Db_Maj7': ['Db', 'F', 'Ab', 'C'],
  'Db_min7': ['Db', 'E', 'Ab', 'B'],
  'Db_7': ['Db', 'F', 'Ab', 'B'],
  'Db_ø7': ['Db', 'E', 'G', 'B'],
  'Db_o7': ['Db', 'E', 'G', 'Bb'],

  'D_Maj7': ['D', 'F#', 'A', 'C#'],
  'D_min7': ['D', 'F', 'A', 'C'],
  'D_7': ['D', 'F#', 'A', 'C'],
  'D_ø7': ['D', 'F', 'Ab', 'C'],
  'D_o7': ['D', 'F', 'Ab', 'B'],

  'Eb_Maj7': ['Eb', 'G', 'Bb', 'D'],
  'Eb_min7': ['Eb', 'Gb', 'Bb', 'Db'],
  'Eb_7': ['Eb', 'G', 'Bb', 'Db'],
  'Eb_ø7': ['Eb', 'Gb', 'A', 'Db'],
  'Eb_o7': ['Eb', 'Gb', 'A', 'C'],

  'E_Maj7': ['E', 'G#', 'B', 'D#'],
  'E_min7': ['E', 'G', 'B', 'D'],
  'E_7': ['E', 'G#', 'B', 'D'],
  'E_ø7': ['E', 'G', 'Bb', 'D'],
  'E_o7': ['E', 'G', 'Bb', 'C#'],

  'F_Maj7': ['F', 'A', 'C', 'E'],
  'F_min7': ['F', 'Ab', 'C', 'Eb'],
  'F_7': ['F', 'A', 'C', 'Eb'],
  'F_ø7': ['F', 'Ab', 'B', 'Eb'],
  'F_o7': ['F', 'Ab', 'B', 'D'],

  'F#_Maj7': ['F#', 'A#', 'C#', 'E#'],
  'F#-7': ['F#', 'A', 'C#', 'E'], // Compatibility: min7 spelt as min7 but sometimes -7
  'F#_min7': ['F#', 'A', 'C#', 'E'],
  'F#_7': ['F#', 'A#', 'C#', 'E'],
  'F#_ø7': ['F#', 'A', 'C', 'E'],
  'F#_o7': ['F#', 'A', 'C', 'D#'],

  'G_Maj7': ['G', 'B', 'D', 'F#'],
  'G_min7': ['G', 'Bb', 'D', 'F'],
  'G_7': ['G', 'B', 'D', 'F'],
  'G_ø7': ['G', 'Bb', 'Db', 'F'],
  'G_o7': ['G', 'Bb', 'Db', 'E'],

  'Ab_Maj7': ['Ab', 'C', 'Eb', 'G'],
  'Ab_min7': ['Ab', 'B', 'Eb', 'Gb'],
  'Ab_7': ['Ab', 'C', 'Eb', 'Gb'],
  'Ab_ø7': ['Ab', 'B', 'D', 'Gb'],
  'Ab_o7': ['Ab', 'B', 'D', 'F'],

  'A_Maj7': ['A', 'C#', 'E', 'G#'],
  'A_min7': ['A', 'C', 'E', 'G'],
  'A_7': ['A', 'C#', 'E', 'G'],
  'A_ø7': ['A', 'C', 'Eb', 'G'],
  'A_o7': ['A', 'C', 'Eb', 'F#'],

  'Bb_Maj7': ['Bb', 'D', 'F', 'A'],
  'Bb_min7': ['Bb', 'Db', 'F', 'Ab'],
  'Bb_7': ['Bb', 'D', 'F', 'Ab'],
  'Bb_ø7': ['Bb', 'Db', 'E', 'Ab'],
  'Bb_o7': ['Bb', 'Db', 'E', 'G'],

  'B_Maj7': ['B', 'D#', 'F#', 'A#'],
  'B_min7': ['B', 'D', 'F#', 'A'],
  'B_7': ['B', 'D#', 'F#', 'A'],
  'B_ø7': ['B', 'D', 'F', 'A'],
  'B_o7': ['B', 'D', 'F', 'G#'],
};

// Spellings for non-chord intervals (II, IV, VI) based on root
const NON_CHORD_SPELLINGS: Record<ChordRoot, Record<'II' | 'IV' | 'VI', string>> = {
  'C': { II: 'D', IV: 'F', VI: 'A' },
  'Db': { II: 'Eb', IV: 'Gb', VI: 'Bb' },
  'D': { II: 'E', IV: 'G', VI: 'B' },
  'Eb': { II: 'F', IV: 'Ab', VI: 'C' },
  'E': { II: 'F#', IV: 'A', VI: 'C#' },
  'F': { II: 'G', IV: 'Bb', VI: 'D' },
  'F#': { II: 'G#', IV: 'B', VI: 'D#' },
  'G': { II: 'A', IV: 'C', VI: 'E' },
  'Ab': { II: 'Bb', IV: 'Db', VI: 'F' },
  'A': { II: 'B', IV: 'D', VI: 'F#' },
  'Bb': { II: 'C', IV: 'Eb', VI: 'G' },
  'B': { II: 'C#', IV: 'E', VI: 'G#' },
};

// Semitone offset map from root for scale degrees (I to VII)
export const INTERVAL_SEMITONES: Record<string, number> = {
  'I': 0,
  'II': 2,
  'III': 4, // Will adjust dynamically for minor chords
  'IV': 5,
  'V': 7,   // Will adjust dynamically for diminished chords
  'VI': 9,
  'VII': 11, // Will adjust dynamically for minor/dominant/diminished chords
};

// Detailed names for intervals based on chord tone and chord type
export const getIntervalName = (interval: string, chordType: ChordType): string => {
  switch (interval) {
    case 'I':
      return 'Root';
    case 'II':
      return 'Major 2nd';
    case 'III':
      return chordType === 'Maj7' || chordType === '7' ? 'Major 3rd' : 'Minor 3rd';
    case 'IV':
      return 'Perfect 4th';
    case 'V':
      return chordType === 'ø7' || chordType === 'o7' ? 'Diminished 5th' : 'Perfect 5th';
    case 'VI':
      return 'Major 6th';
    case 'VII':
      if (chordType === 'Maj7') return 'Major 7th';
      if (chordType === 'o7') return 'Diminished 7th';
      return 'Minor 7th';
    default:
      return 'Interval';
  }
};

/**
 * Returns the name of the note for a given chord root, type, and interval
 */
export const getNoteSpelling = (root: ChordRoot, chordType: ChordType, interval: string): string => {
  if (interval === 'II' || interval === 'IV' || interval === 'VI') {
    return NON_CHORD_SPELLINGS[root][interval as 'II' | 'IV' | 'VI'];
  }

  // Normalize key to standard min7 if it's named min7 or similar
  const typeKey = chordType === 'min7' ? 'min7' : chordType;
  const key = `${root}_${typeKey}`;
  const chordSpelling = CHORD_SPELLINGS[key];
  if (!chordSpelling) {
    // Try lowercase or dash spelling if needed
    const backupKey = `${root}_${chordType === 'min7' ? 'min7' : chordType}`;
    const backupSpelling = CHORD_SPELLINGS[backupKey];
    if (!backupSpelling) return root;
    return getSpelledItem(backupSpelling, interval, root);
  }

  return getSpelledItem(chordSpelling, interval, root);
};

const getSpelledItem = (spelling: string[], interval: string, root: string): string => {
  switch (interval) {
    case 'I':
      return spelling[0];
    case 'III':
      return spelling[1];
    case 'V':
      return spelling[2];
    case 'VII':
      return spelling[3];
    default:
      return root;
  }
};

/**
 * Returns the semitone offset from the root for a specific chord root, type, and interval
 */
export const getIntervalOffset = (_root: ChordRoot, chordType: ChordType, interval: string): number => {
  if (interval === 'II') return 2;
  if (interval === 'IV') return 5;
  if (interval === 'VI') return 9;

  const def = CHORD_DEFINITIONS[chordType];
  switch (interval) {
    case 'I':
      return def.intervals[0];
    case 'III':
      return def.intervals[1];
    case 'V':
      return def.intervals[2];
    case 'VII':
      return def.intervals[3];
    default:
      return 0;
  }
};

// Map note name (A, Bb, etc.) to pitch class (0-11)
export const NOTE_TO_PITCH_CLASS: Record<string, number> = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11,
};

export const getPitchClass = (noteName: string): number => {
  // Extract base note name and accidental
  const match = noteName.match(/^[A-G][b#]*/);
  if (!match) return 0;
  return NOTE_TO_PITCH_CLASS[match[0]] ?? 0;
};

/**
 * Returns all notes in standard written chromatic range (MIDI 40 to 67)
 * mapped to their correct spelling name based on pitch class
 */
export const getNoteSpellingForMidi = (midi: number, preferredSpelling: 'sharp' | 'flat' | string[]): string => {
  const pitchClass = midi % 12;
  
  if (Array.isArray(preferredSpelling)) {
    // If we have a list of chord tones, see if any chord tone matches this pitch class
    const match = preferredSpelling.find(n => getPitchClass(n) === pitchClass);
    if (match) return match;
  }

  // Fallbacks
  const sharpMap: Record<number, string> = {
    0: 'C', 1: 'C#', 2: 'D', 3: 'D#', 4: 'E', 5: 'F', 6: 'F#', 7: 'G', 8: 'G#', 9: 'A', 10: 'A#', 11: 'B'
  };
  const flatMap: Record<number, string> = {
    0: 'C', 1: 'Db', 2: 'D', 3: 'Eb', 4: 'E', 5: 'F', 6: 'Gb', 7: 'G', 8: 'Ab', 9: 'A', 10: 'Bb', 11: 'B'
  };

  const isFlatPref = preferredSpelling === 'flat' || 
    (typeof preferredSpelling === 'string' && ['Db', 'Eb', 'F', 'Ab', 'Bb'].some(x => preferredSpelling.startsWith(x)));

  return isFlatPref ? flatMap[pitchClass] : sharpMap[pitchClass];
};
