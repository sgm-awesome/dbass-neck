import { 
  getNoteSpelling, 
  getIntervalOffset, 
  getIntervalName, 
  getPitchClass, 
  getNoteSpellingForMidi,
  getMultiTargetItems,
  getChordTones,
  getChordMidis
} from './musicTheory';

// A simple test assertion runner
declare const process: { exit: (code: number) => void };

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('Running Music Theory Engine Unit Tests...');

// 1. Check note spelling calculations
assert(getNoteSpelling('C', 'min7', 'III') === 'Eb', 'C min7 Third should be Eb');
assert(getNoteSpelling('C', 'Maj7', 'III') === 'E', 'C Maj7 Third should be E');
assert(getNoteSpelling('C', 'ø7', 'V') === 'Gb', 'C ø7 Fifth should be Gb');
assert(getNoteSpelling('G', '7', 'VII') === 'F', 'G 7 Seventh should be F');
assert(getNoteSpelling('D', 'min7', 'II') === 'E', 'D min7 Second should be E');
assert(getNoteSpelling('F#', 'Maj7', 'VII') === 'E#', 'F# Maj7 Seventh should be E#');

// 2. Check semitone offsets
assert(getIntervalOffset('C', 'Maj7', 'VII') === 11, 'Major 7th offset should be 11 semitones');
assert(getIntervalOffset('C', 'min7', 'III') === 3, 'Minor 3rd offset should be 3 semitones');
assert(getIntervalOffset('C', '7', 'VII') === 10, 'Dominant 7th offset should be 10 semitones');

// 3. Check interval description names
assert(getIntervalName('III', 'min7') === 'Minor 3rd', 'III in min7 is Minor 3rd');
assert(getIntervalName('III', 'Maj7') === 'Major 3rd', 'III in Maj7 is Major 3rd');
assert(getIntervalName('V', 'ø7') === 'Diminished 5th', 'V in ø7 is Diminished 5th');
assert(getIntervalName('VII', 'o7') === 'Diminished 7th', 'VII in o7 is Diminished 7th');

// 4. Check pitch class parsing
assert(getPitchClass('C') === 0, 'C pitch class is 0');
assert(getPitchClass('C#') === 1, 'C# pitch class is 1');
assert(getPitchClass('Db') === 1, 'Db pitch class is 1');
assert(getPitchClass('Eb') === 3, 'Eb pitch class is 3');
assert(getPitchClass('F') === 5, 'F pitch class is 5');
assert(getPitchClass('Bb') === 10, 'Bb pitch class is 10');

// 5. Check MIDI note spelling helper
assert(getNoteSpellingForMidi(40, 'flat') === 'E', 'MIDI 40 spelling is E');
assert(getNoteSpellingForMidi(41, 'flat') === 'F', 'MIDI 41 spelling is F');
assert(getNoteSpellingForMidi(46, 'flat') === 'Bb', 'MIDI 46 spelling (flat pref) is Bb');
assert(getNoteSpellingForMidi(46, 'sharp') === 'A#', 'MIDI 46 spelling (sharp pref) is A#');

// 6. Check multi-target chord tones helper
const multiItems = getMultiTargetItems('C', 'min7', ['III', 'V', 'VII']);
assert(multiItems.length === 3, 'Multi items should have 3 tones');
assert(multiItems[0].spelling === 'Eb' && multiItems[0].interval === 'III', 'C min7 3rd should be Eb');
assert(multiItems[1].spelling === 'G' && multiItems[1].interval === 'V', 'C min7 5th should be G');
assert(multiItems[2].spelling === 'Bb' && multiItems[2].interval === 'VII', 'C min7 7th should be Bb');

// 7. Check Reference Mode getChordTones helper
const cMaj7Tones = getChordTones('C', 'Maj7');
assert(cMaj7Tones.length === 4, 'C Maj7 should have 4 chord tones');
assert(cMaj7Tones[0].spelling === 'C' && cMaj7Tones[0].shortLabel === 'R', 'C Maj7 Root should be C / R');
assert(cMaj7Tones[1].spelling === 'E' && cMaj7Tones[1].shortLabel === '3', 'C Maj7 3rd should be E / 3');
assert(cMaj7Tones[2].spelling === 'G' && cMaj7Tones[2].shortLabel === '5', 'C Maj7 5th should be G / 5');
assert(cMaj7Tones[3].spelling === 'B' && cMaj7Tones[3].shortLabel === '7', 'C Maj7 7th should be B / 7');

const fHalfDimTones = getChordTones('F', 'ø7');
assert(fHalfDimTones[1].spelling === 'Ab' && fHalfDimTones[1].shortLabel === '♭3', 'F ø7 3rd should be Ab / ♭3');
assert(fHalfDimTones[2].spelling === 'B' && fHalfDimTones[2].shortLabel === '♭5', 'F ø7 5th should be B / ♭5');
assert(fHalfDimTones[3].spelling === 'Eb' && fHalfDimTones[3].shortLabel === '♭7', 'F ø7 7th should be Eb / ♭7');

const gDim7Tones = getChordTones('G', 'o7');
assert(gDim7Tones[3].shortLabel === '𝄫7', 'G o7 7th should have label 𝄫7');

// 8. Check getChordMidis helper
const cMin7Midis = getChordMidis('C', 'min7');
assert(cMin7Midis.length === 4, 'C min7 midis should have 4 pitches');
assert(cMin7Midis[0] === 48, 'C min7 root should be MIDI 48 (C3)');
assert(cMin7Midis[1] === 51, 'C min7 3rd should be MIDI 51 (Eb3)');
assert(cMin7Midis[2] === 55, 'C min7 5th should be MIDI 55 (G3)');
assert(cMin7Midis[3] === 58, 'C min7 7th should be MIDI 58 (Bb3)');

const e7Midis = getChordMidis('E', '7');
assert(e7Midis[0] === 40, 'E7 root should be MIDI 40 (E2 open)');
assert(e7Midis[1] === 44, 'E7 3rd should be MIDI 44 (G#2)');
assert(e7Midis[2] === 47, 'E7 5th should be MIDI 47 (B2)');
assert(e7Midis[3] === 50, 'E7 7th should be MIDI 50 (D3 open)');

console.log('All music theory tests passed successfully! 🎹🎉');

