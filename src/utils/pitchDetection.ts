/**
 * Pitch Detection and Note Conversion Utilities
 * Optimized for Double Bass (fundamental range ~35Hz to 400Hz)
 */

export interface DetectedPitch {
  freq: number;
  confidence: number;
  midi: number;
  cents: number;
  pitchClass: number; // 0 = C, 1 = C#/Db, ..., 11 = B
  noteName: string;
  octave: number;
  rms: number;
}

const CHROMATIC_SCALE_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const CHROMATIC_SCALE_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * Computes Root Mean Square (volume level) of an audio buffer
 */
export const computeRMS = (buffer: Float32Array): number => {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
};

/**
 * Converts frequency (Hz) to exact floating-point MIDI note number
 */
export const freqToMidi = (freq: number): number => {
  return 69 + 12 * Math.log2(freq / 440);
};

/**
 * Converts MIDI note number to frequency (Hz)
 */
export const midiToFreq = (midi: number): number => {
  return 440 * Math.pow(2, (midi - 69) / 12);
};

/**
 * Calculates tuning deviation in cents (-50 to +50) from nearest integer MIDI pitch
 */
export const centsOffset = (freq: number, roundedMidi: number): number => {
  const targetFreq = midiToFreq(roundedMidi);
  return Math.round(1200 * Math.log2(freq / targetFreq));
};

/**
 * Map MIDI note to note name, pitch class, and octave
 */
export const midiToNoteDetails = (
  midi: number,
  preferredSpelling?: 'sharp' | 'flat' | string[]
): { noteName: string; pitchClass: number; octave: number } => {
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;

  let noteName = CHROMATIC_SCALE_SHARP[pitchClass];

  if (Array.isArray(preferredSpelling)) {
    const match = preferredSpelling.find(name => {
      const clean = name.replace(/[0-9]/g, '');
      const sharpIdx = CHROMATIC_SCALE_SHARP.indexOf(clean);
      const flatIdx = CHROMATIC_SCALE_FLAT.indexOf(clean);
      return sharpIdx === pitchClass || flatIdx === pitchClass;
    });
    if (match) {
      noteName = match.replace(/[0-9]/g, '');
    } else {
      noteName = CHROMATIC_SCALE_FLAT[pitchClass];
    }
  } else if (preferredSpelling === 'flat') {
    noteName = CHROMATIC_SCALE_FLAT[pitchClass];
  }

  return {
    noteName,
    pitchClass,
    octave,
  };
};

/**
 * Autocorrelation algorithm with parabolic interpolation
 * to accurately estimate fundamental frequency of double bass notes.
 */
export const autoCorrelate = (
  buffer: Float32Array,
  sampleRate: number,
  minFreq = 35,
  maxFreq = 400
): { freq: number; confidence: number; rms: number } | null => {
  const rms = computeRMS(buffer);
  if (rms < 0.012) {
    // Too quiet / ambient room silence
    return null;
  }

  const minLag = Math.floor(sampleRate / maxFreq);
  const maxLag = Math.min(Math.ceil(sampleRate / minFreq), buffer.length - 1);

  if (minLag >= maxLag || maxLag >= buffer.length) {
    return null;
  }

  // Energy at lag 0
  let energy0 = 0;
  for (let i = 0; i < buffer.length - maxLag; i++) {
    energy0 += buffer[i] * buffer[i];
  }
  if (energy0 === 0) return null;

  let bestLag = -1;
  let bestCorr = -1;

  // Normalized autocorrelation
  const correlations = new Float32Array(maxLag + 1);

  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    let energyLag = 0;
    const windowLength = buffer.length - maxLag;

    for (let i = 0; i < windowLength; i++) {
      sum += buffer[i] * buffer[i + lag];
      energyLag += buffer[i + lag] * buffer[i + lag];
    }

    const norm = Math.sqrt(energy0 * energyLag);
    const r = norm > 0 ? sum / norm : 0;
    correlations[lag] = r;

    if (r > bestCorr) {
      bestCorr = r;
      bestLag = lag;
    }
  }

  // Threshold check for pitch clarity
  if (bestCorr < 0.75 || bestLag <= minLag || bestLag >= maxLag) {
    return null;
  }

  // Check if an earlier peak (half the lag) has comparable correlation to avoid octave doubling
  const halfLag = Math.round(bestLag / 2);
  if (halfLag >= minLag && correlations[halfLag] > 0.92 * bestCorr) {
    bestLag = halfLag;
    bestCorr = correlations[halfLag];
  }

  // Parabolic interpolation for sub-sample accuracy
  const y0 = correlations[bestLag - 1];
  const y1 = correlations[bestLag];
  const y2 = correlations[bestLag + 1];

  const denom = 2 * (2 * y1 - y0 - y2);
  const delta = denom !== 0 ? (y2 - y0) / denom : 0;
  const exactLag = bestLag + delta;

  const freq = sampleRate / exactLag;

  return {
    freq,
    confidence: bestCorr,
    rms,
  };
};

/**
 * Complete pitch analysis on an audio buffer
 */
export const detectPitchFromBuffer = (
  buffer: Float32Array,
  sampleRate: number,
  preferredSpelling?: 'sharp' | 'flat' | string[]
): DetectedPitch | null => {
  const result = autoCorrelate(buffer, sampleRate);
  if (!result) return null;

  const exactMidi = freqToMidi(result.freq);
  const roundedMidi = Math.round(exactMidi);
  const cents = centsOffset(result.freq, roundedMidi);
  const { noteName, pitchClass, octave } = midiToNoteDetails(roundedMidi, preferredSpelling);

  return {
    freq: Math.round(result.freq * 10) / 10,
    confidence: Math.round(result.confidence * 100) / 100,
    midi: roundedMidi,
    cents,
    pitchClass,
    noteName,
    octave,
    rms: Math.round(result.rms * 1000) / 1000,
  };
};
