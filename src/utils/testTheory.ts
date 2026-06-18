import { 
  getNoteSpelling, 
  getIntervalOffset, 
  getIntervalName, 
  getPitchClass, 
  getNoteSpellingForMidi 
} from './musicTheory';

// A simple test assertion runner
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

console.log('All music theory tests passed successfully! 🎹🎉');
