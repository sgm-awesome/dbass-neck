import React from 'react';
import { getNoteSpelling } from '../utils/musicTheory';
import type { ChordRoot, ChordType } from '../utils/musicTheory';

interface MusicalStaffProps {
  rootNote: ChordRoot;
  chordType: ChordType;
  targetInterval: string;
  showAnswer: boolean;
  isCorrect: boolean;
}

// Convert a note spelling like "Eb3" into diatonic step and accidental
interface ParsedNote {
  letter: string;
  accidental: string;
  octave: number;
}

const parseNoteName = (noteName: string): ParsedNote => {
  // Matches e.g., "Eb3", "F#2", "C4", "Bbb3"
  const match = noteName.match(/^([A-G])(b+|#+|♮)?(\d)$/);
  if (!match) {
    return { letter: 'C', accidental: '', octave: 3 };
  }
  return {
    letter: match[1],
    accidental: match[2] || '',
    octave: parseInt(match[3], 10),
  };
};

const getDiatonicStep = (parsed: ParsedNote): number => {
  const letterSteps: Record<string, number> = {
    'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6
  };
  const baseStep = letterSteps[parsed.letter] ?? 0;
  // Diatonic steps relative to C4 (Middle C)
  return (parsed.octave - 4) * 7 + baseStep;
};

// Map written MIDI notes of open strings to their written spelling
// E2 (40), A2 (45), D3 (50), G3 (55)
// Let's estimate standard octaves for the chord tones.
// We want to spell the root and target notes in standard positions on the bass staff.
// Let's place the root note on a realistic octave:
// - E, F, F#, G, Ab, A, Bb, B: Octave 2 or 3.
// Let's map roots to a good starting octave on the bass clef:
// - C, Db, D, Eb: Octave 3 (C3 is the second space of bass clef, D3 is the middle line, Eb3 is the third space)
// - E, F, F#, G, Ab, A, Bb, B: Octave 2 (E2 is ledger line below, G2 is bottom line, A2 is first space, Bb2 is line 2)
// This fits the bass clef register beautifully!
const getRootWrittenSpelling = (root: ChordRoot): string => {
  if (['C', 'Db', 'D', 'Eb'].includes(root)) {
    return `${root}3`;
  }
  return `${root}2`;
};

const getTargetWrittenSpelling = (root: ChordRoot, chordType: ChordType, interval: string, rootSpelled: string): string => {
  // Let's figure out the note name for the target interval
  const noteName = getNoteSpelling(root, chordType, interval);
  
  // Parse the root spelling to know its octave
  const parsedRoot = parseNoteName(rootSpelled);
  
  // Calculate approximate target octave based on interval size
  // If the target interval is higher, increase octave as needed
  const rootLetterSteps: Record<string, number> = {
    'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6
  };
  
  const rootBase = rootLetterSteps[parsedRoot.letter];
  const cleanTargetNote = noteName.replace(/[b#]/g, '');
  const targetBase = rootLetterSteps[cleanTargetNote] ?? 0;
  
  let targetOctave = parsedRoot.octave;
  
  // If target note letter index is lower than root letter index, it usually rolls over to the next octave
  // e.g., if root is G2 (step 4) and target is C (step 0), C is higher in pitch, so it's C3
  if (targetBase < rootBase) {
    targetOctave += 1;
  }
  
  // Special check for large intervals like 7ths to make sure they're always higher
  if (interval === 'VII' && targetBase === rootBase) {
    targetOctave += 1;
  }

  // Double check: if target is lower than root in pitch, adjust octave
  // E.g., if Root is C3, and we want B (VII), target is B2, which has targetBase = 6, which is > rootBase (0).
  // But B2 is lower than C3, so B must be B2, which is targetBase < rootBase (false), but octave should be rootOctave - 1.
  // Actually, let's make it simpler: we want target to be above the root or within standard octave.
  // For intervals II, III, IV, V, VI, VII, they are above the root:
  // Let's compute diatonic step difference.
  const intervalMap: Record<string, number> = { 'I': 0, 'II': 1, 'III': 2, 'IV': 3, 'V': 4, 'VI': 5, 'VII': 6 };
  const expectedDiff = intervalMap[interval] ?? 0;
  
  // Solve for targetOctave:
  // targetBase + targetOctave*7 - (rootBase + rootOctave*7) = expectedDiff
  // targetOctave*7 = expectedDiff + rootBase + rootOctave*7 - targetBase
  // targetOctave = (expectedDiff + rootBase - targetBase)/7 + rootOctave
  const targetOctaveFloat = (expectedDiff + rootBase - targetBase) / 7 + parsedRoot.octave;
  targetOctave = Math.round(targetOctaveFloat);

  return `${noteName}${targetOctave}`;
};

export const MusicalStaff: React.FC<MusicalStaffProps> = ({
  rootNote,
  chordType,
  targetInterval,
  showAnswer,
  isCorrect,
}) => {
  const rootSpelledName = getRootWrittenSpelling(rootNote);
  const targetNoteName = getNoteSpelling(rootNote, chordType, targetInterval);
  const targetSpelledName = getTargetWrittenSpelling(rootNote, chordType, targetInterval, rootSpelledName);

  const parsedRoot = parseNoteName(rootSpelledName);
  const parsedTarget = parseNoteName(targetSpelledName);

  const rootStep = getDiatonicStep(parsedRoot);
  const targetStep = getDiatonicStep(parsedTarget);

  // Y-coordinate reference: Middle C (C4) is step 0, Y = 12px
  // Each step is 6px (so staff lines spaced by 12px)
  const Y_REF = 12;
  const STEP_H = 6;
  const getY = (step: number) => Y_REF - step * STEP_H;

  const rootY = getY(rootStep);
  const targetY = getY(targetStep);

  // Render staff lines (Lines 1 to 5)
  // Line 5 is A3 (step -2). Line 1 is G2 (step -10).
  // Y coordinates:
  // Line 5 (A3): getY(-2) = 12 - (-2)*6 = 24px
  // Line 4 (F3): getY(-4) = 12 - (-4)*6 = 36px
  // Line 3 (D3): getY(-6) = 12 - (-6)*6 = 48px
  // Line 2 (B2): getY(-8) = 12 - (-8)*6 = 60px
  // Line 1 (G2): getY(-10) = 12 - (-10)*6 = 72px
  const staffLines = [-2, -4, -6, -8, -10].map(step => getY(step));

  // Ledger line rendering helper
  const renderLedgerLines = (noteY: number, x: number) => {
    const lines: React.ReactNode[] = [];
    const width = 24;
    const halfW = width / 2;

    // Standard staff top line Y is staffLines[0] = 24px, bottom line is staffLines[4] = 72px
    // Ledger lines are spaced by 12px (2 steps)
    const topStaffY = staffLines[0];
    const bottomStaffY = staffLines[4];

    if (noteY <= topStaffY - 12) {
      // Note is above staff
      for (let ly = topStaffY - 12; ly >= noteY - 2; ly -= 12) {
        lines.push(
          <line
            key={`ledger-up-${ly}`}
            x1={x - halfW}
            y1={ly}
            x2={x + halfW}
            y2={ly}
            stroke="var(--foreground)"
            strokeWidth="1.5"
            opacity="0.8"
          />
        );
      }
    } else if (noteY >= bottomStaffY + 12) {
      // Note is below staff
      for (let ly = bottomStaffY + 12; ly <= noteY + 2; ly += 12) {
        lines.push(
          <line
            key={`ledger-down-${ly}`}
            x1={x - halfW}
            y1={ly}
            x2={x + halfW}
            y2={ly}
            stroke="var(--foreground)"
            strokeWidth="1.5"
            opacity="0.8"
          />
        );
      }
    }
    return lines;
  };

  const formatAccidental = (acc: string) => {
    if (acc === 'b') return '♭';
    if (acc === 'bb') return '𝄫';
    if (acc === '#') return '♯';
    if (acc === '##') return '𝄪';
    return '';
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-violet-500/30">
      <div className="text-xs uppercase tracking-widest text-violet-400 font-semibold mb-2">Musical Notation (Bass Clef)</div>
      
      <div className="relative w-full max-w-[280px] h-[120px] flex justify-center items-center overflow-visible">
        <svg
          viewBox="0 0 240 100"
          className="w-full h-full overflow-visible"
          style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}
        >
          {/* Staff Lines */}
          {staffLines.map((y, index) => (
            <line
              key={`staff-${index}`}
              x1="10"
              y1={y}
              x2="230"
              y2={y}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1.5"
            />
          ))}

          {/* Clef - Bass Clef SVG Group */}
          <g transform="translate(16, 24)" className="fill-violet-400">
            {/* The main hook starting dot on 4th line (Y = 36, which relative to group is Y = 12) */}
            <circle cx="6" cy="12" r="3.5" />
            {/* Clef curve */}
            <path
              d="M 6.5,12 C 12,18 20,13 18,3 C 16,-4 8,-2 5.5,5 C 4.5,8 5,16 6,18 C 7,20 10,24 8,28"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            {/* Two dots in spaces surrounding the F line (3rd and 4th spaces) */}
            <circle cx="25" cy="6" r="2" />
            <circle cx="25" cy="18" r="2" />
          </g>

          {/* Root Note (X = 90) */}
          <g>
            {renderLedgerLines(rootY, 90)}
            {/* Accidental */}
            {parsedRoot.accidental && (
              <text
                x="72"
                y={rootY + 5}
                className="fill-indigo-300 font-serif font-medium"
                fontSize="20"
                textAnchor="middle"
              >
                {formatAccidental(parsedRoot.accidental)}
              </text>
            )}
            {/* Notehead (slanted ellipse) */}
            <ellipse
              cx="90"
              cy={rootY}
              rx="6.5"
              ry="4.5"
              transform={`rotate(-15, 90, ${rootY})`}
              className="fill-indigo-400 stroke-indigo-200 stroke-[1]"
            />
            {/* Root text tag */}
            <text
              x="90"
              y="92"
              className="fill-indigo-300/80 font-semibold tracking-wider"
              fontSize="9"
              textAnchor="middle"
            >
              R ({rootNote})
            </text>
          </g>

          {/* Target Note (X = 170) */}
          <g>
            {showAnswer ? (
              <>
                {renderLedgerLines(targetY, 170)}
                {/* Accidental */}
                {parsedTarget.accidental && (
                  <text
                    x="152"
                    y={targetY + 5}
                    className={`font-serif font-medium ${isCorrect ? 'fill-emerald-400' : 'fill-rose-400'}`}
                    fontSize="20"
                    textAnchor="middle"
                  >
                    {formatAccidental(parsedTarget.accidental)}
                  </text>
                )}
                {/* Notehead */}
                <ellipse
                  cx="170"
                  cy={targetY}
                  rx="6.5"
                  ry="4.5"
                  transform={`rotate(-15, 170, ${targetY})`}
                  className={`${isCorrect ? 'fill-emerald-400 stroke-emerald-200' : 'fill-rose-400 stroke-rose-200'} stroke-[1]`}
                />
                <text
                  x="170"
                  y="92"
                  className={`font-bold tracking-wider ${isCorrect ? 'fill-emerald-400' : 'fill-rose-400'}`}
                  fontSize="10"
                  textAnchor="middle"
                >
                  {targetNoteName}
                </text>
              </>
            ) : (
              <>
                {/* Question Mark Notehead */}
                <g transform={`translate(160, ${targetY - 14})`}>
                  <ellipse
                    cx="10"
                    cy="14"
                    rx="7"
                    ry="5"
                    transform="rotate(-15, 10, 14)"
                    className="fill-none stroke-violet-400/40 stroke-[1.5] stroke-dasharray-[2]"
                  />
                  <text
                    x="10"
                    y="18"
                    className="fill-violet-400 font-bold"
                    fontSize="14"
                    textAnchor="middle"
                  >
                    ?
                  </text>
                </g>
                <text
                  x="170"
                  y="92"
                  className="fill-violet-400/50 font-bold tracking-wider"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {targetInterval}
                </text>
              </>
            )}
          </g>
        </svg>
      </div>
    </div>
  );
};
