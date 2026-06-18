import React, { useMemo } from 'react';
import { BASS_STRINGS, getNoteSpellingForMidi, getPitchClass } from '../utils/musicTheory';
import type { ChordRoot } from '../utils/musicTheory';

interface DoubleBassNeckProps {
  rootNote: ChordRoot;
  targetNoteSpelling: string; // spelled name to find, e.g., "Eb"
  showNoteNames: boolean;      // settings: show all note names
  showTapes: boolean;          // settings: show student tapes
  showPositionLines: boolean;   // settings: show faint fretlines
  guessedWrongNotes: string[];  // notes clicked wrong: "stringIndex_position"
  correctNoteClicked: string | null; // "stringIndex_position" if correct note found
  showAnswer: boolean;         // highlight correct note location(s)
  onNoteClick: (stringIndex: number, position: number, midiPitch: number, noteName: string) => void;
}

export const DoubleBassNeck: React.FC<DoubleBassNeckProps> = ({
  rootNote,
  targetNoteSpelling,
  showNoteNames,
  showTapes,
  showPositionLines,
  guessedWrongNotes,
  correctNoteClicked,
  showAnswer,
  onNoteClick,
}) => {
  // Dimensions
  const neckWidth = 680;
  const neckHeightNut = 120;
  const neckHeightBody = 160;
  const nutX = 60;
  const fbWidth = neckWidth - nutX - 20; // width of fingerboard area

  // Taper formulas
  // At x = 0, y ranges from (100 - neckHeightNut)/2 to (100 + neckHeightNut)/2
  // Let's center the neck vertically in an SVG of height 180
  const svgHeight = 180;
  const centerY = svgHeight / 2;

  const getNeckBounds = (x: number) => {
    const ratio = x / neckWidth;
    const currentHeight = neckHeightNut + (neckHeightBody - neckHeightNut) * ratio;
    const topY = centerY - currentHeight / 2;
    const bottomY = centerY + currentHeight / 2;
    return { topY, bottomY, height: currentHeight };
  };

  // Logarithmic position calculations
  // Position 0 = nut (nutX)
  // Position 1 to 12
  const positionsX = useMemo(() => {
    const coords: number[] = [nutX]; // 0 is nut
    for (let p = 1; p <= 12; p++) {
      // Logarithmic spacing: x_p = nutX + fbWidth * (1 - 2^(-p/12)) / (1 - 2^(-12/12))
      // 1 - 2^(-12/12) = 0.5
      const offset = fbWidth * (1 - Math.pow(2, -p / 12)) / 0.5;
      coords.push(nutX + offset);
    }
    return coords;
  }, [nutX, fbWidth]);

  // Coordinates of strings at any X position
  // stringIndex: 0 = G (top), 1 = D, 2 = A, 3 = E (bottom)
  const getStringY = (stringIndex: number, x: number) => {
    const { topY, height } = getNeckBounds(x);
    // Distribute 4 strings evenly across current neck height
    // e.g. padding on top and bottom = 15% of height
    const padding = height * 0.14;
    const activeHeight = height - padding * 2;
    const spacing = activeHeight / 3;
    return topY + padding + stringIndex * spacing;
  };

  // Get note info for a string and position
  const getNoteInfo = (stringIndex: number, position: number) => {
    const stringConfig = BASS_STRINGS[stringIndex];
    const midiWritten = stringConfig.openMidi + position;
    // spell based on chord context
    const spelledName = getNoteSpellingForMidi(midiWritten, [rootNote, targetNoteSpelling]);
    return {
      midi: midiWritten,
      name: spelledName,
      pitchClass: getPitchClass(spelledName),
    };
  };

  // Standard student tapes: 3rd position, 5th, 7th, 9th, 12th
  const tapePositions = [3, 5, 7, 9, 12];

  // Check if a note is a correct answer (matching pitch class of the target note)
  const isCorrectPitchClass = (stringIndex: number, position: number) => {
    const noteInfo = getNoteInfo(stringIndex, position);
    return getPitchClass(noteInfo.name) === getPitchClass(targetNoteSpelling);
  };

  // Check if a note is a root note
  const isRootPitchClass = (stringIndex: number, position: number) => {
    const noteInfo = getNoteInfo(stringIndex, position);
    return getPitchClass(noteInfo.name) === getPitchClass(rootNote);
  };

  return (
    <div className="w-full flex flex-col items-center select-none overflow-x-auto pb-4 custom-scrollbar">
      <div className="relative min-w-[700px] h-[200px] flex items-center justify-center">
        <svg
          width={neckWidth}
          height={svgHeight}
          className="overflow-visible"
          style={{ filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.5))' }}
        >
          {/* Definitions for gradients */}
          <defs>
            {/* Ebony fingerboard gradient */}
            <linearGradient id="ebonyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1a1c24" />
              <stop offset="25%" stopColor="#11131a" />
              <stop offset="50%" stopColor="#0a0c10" />
              <stop offset="75%" stopColor="#161822" />
              <stop offset="100%" stopColor="#0d0e12" />
            </linearGradient>
            {/* Pegbox / Headstock gradient */}
            <linearGradient id="woodGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4a2511" />
              <stop offset="50%" stopColor="#2e1407" />
              <stop offset="100%" stopColor="#1f0a02" />
            </linearGradient>
            {/* Nut gradient */}
            <linearGradient id="nutGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d9b673" />
              <stop offset="50%" stopColor="#a37c37" />
              <stop offset="100%" stopColor="#5e461b" />
            </linearGradient>
            {/* Soft shadow for strings */}
            <filter id="stringShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="1" floodColor="#000" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* 1. Headstock/Pegbox Visual (left of nut) */}
          <path
            d={`M 0,${centerY - 25} 
               L ${nutX - 10},${centerY - 45} 
               L ${nutX - 10},${centerY + 45} 
               L 0,${centerY + 25} 
               Z`}
            fill="url(#woodGrad)"
            stroke="#1a0b03"
            strokeWidth="2"
          />
          {/* Scroll scroll-ears details */}
          <path
            d={`M 15,${centerY - 25} C -5,${centerY - 35} -5,${centerY + 35} 15,${centerY + 25} Z`}
            fill="#1f0a02"
            opacity="0.6"
          />

          {/* Brass Tuner Pegs */}
          <circle cx="20" cy={centerY - 40} r="6" fill="#cfa144" stroke="#8c6823" strokeWidth="1" />
          <line x1="20" y1={centerY - 40} x2="20" y2={centerY - 28} stroke="#8c6823" strokeWidth="3" />
          <circle cx="40" cy={centerY - 42} r="6" fill="#cfa144" stroke="#8c6823" strokeWidth="1" />
          <line x1="40" y1={centerY - 42} x2="40" y2={centerY - 32} stroke="#8c6823" strokeWidth="3" />
          
          <circle cx="20" cy={centerY + 40} r="6" fill="#cfa144" stroke="#8c6823" strokeWidth="1" />
          <line x1="20" y1={centerY + 40} x2="20" y2={centerY + 28} stroke="#8c6823" strokeWidth="3" />
          <circle cx="40" cy={centerY + 42} r="6" fill="#cfa144" stroke="#8c6823" strokeWidth="1" />
          <line x1="40" y1={centerY + 42} x2="40" y2={centerY + 32} stroke="#8c6823" strokeWidth="3" />

          {/* 2. Ebony Fingerboard (tapered polygon) */}
          <path
            d={`M ${nutX},${getNeckBounds(nutX).topY} 
               L ${neckWidth - 10},${getNeckBounds(neckWidth - 10).topY} 
               L ${neckWidth - 10},${getNeckBounds(neckWidth - 10).bottomY} 
               L ${nutX},${getNeckBounds(nutX).bottomY} 
               Z`}
            fill="url(#ebonyGrad)"
            stroke="#1a1c22"
            strokeWidth="1.5"
          />

          {/* Faint edge highlights to give a curved 3D feel */}
          <path
            d={`M ${nutX},${getNeckBounds(nutX).topY} L ${neckWidth - 10},${getNeckBounds(neckWidth - 10).topY}`}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d={`M ${nutX},${getNeckBounds(nutX).bottomY} L ${neckWidth - 10},${getNeckBounds(neckWidth - 10).bottomY}`}
            stroke="rgba(0, 0, 0, 0.6)"
            strokeWidth="3"
            fill="none"
          />

          {/* 3. Position Lines (Frets Representation) */}
          {showPositionLines &&
            positionsX.slice(1).map((x, index) => {
              const { topY, bottomY } = getNeckBounds(x);
              const isOctave = index + 1 === 12;
              return (
                <line
                  key={`fret-${index}`}
                  x1={x}
                  y1={topY}
                  x2={x}
                  y2={bottomY}
                  stroke={isOctave ? 'rgba(192, 132, 252, 0.3)' : 'rgba(255,255,255,0.09)'}
                  strokeWidth={isOctave ? '2' : '1'}
                  strokeDasharray={isOctave ? 'none' : '3 3'}
                />
              );
            })}

          {/* 4. Student Tapes (Optional visually striking lines) */}
          {showTapes &&
            positionsX.map((x, p) => {
              if (!tapePositions.includes(p)) return null;
              const { topY, bottomY } = getNeckBounds(x);
              
              // Color mapping: gold/orange for standard tapes, violet for 12th octave
              const tapeColor = p === 12 ? 'rgba(168, 85, 247, 0.6)' : 'rgba(234, 179, 8, 0.5)';
              return (
                <g key={`tape-${p}`}>
                  <line
                    x1={x}
                    y1={topY}
                    x2={x}
                    y2={bottomY}
                    stroke={tapeColor}
                    strokeWidth="3.5"
                    opacity="0.85"
                  />
                  {/* Tape label at the bottom */}
                  <text
                    x={x}
                    y={bottomY + 14}
                    fill={p === 12 ? '#c084fc' : '#facc15'}
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {p === 12 ? 'Octave' : `${p}`}
                  </text>
                </g>
              );
            })}

          {/* Position Numbers at the top */}
          {positionsX.map((x, p) => {
            if (p === 0) return null;
            const { topY } = getNeckBounds(x);
            return (
              <text
                key={`pos-num-${p}`}
                x={x}
                y={topY - 8}
                fill="rgba(255, 255, 255, 0.3)"
                fontSize="9"
                fontFamily="sans-serif"
                textAnchor="middle"
              >
                {p}
              </text>
            );
          })}

          {/* 5. The Nut (thick divider bone/brass) */}
          <rect
            x={nutX - 4}
            y={getNeckBounds(nutX).topY - 2}
            width="6"
            height={getNeckBounds(nutX).height + 4}
            fill="url(#nutGrad)"
            rx="2"
            stroke="#473412"
            strokeWidth="0.5"
          />

          {/* 6. Strings (drawn from pegbox to end of neck) */}
          {BASS_STRINGS.map((stringConfig, sIndex) => {
            const startY = getStringY(sIndex, 0);
            const endY = getStringY(sIndex, neckWidth);
            return (
              <g key={`string-${sIndex}`}>
                {/* String shadow */}
                <line
                  x1="0"
                  y1={startY + 1}
                  x2={neckWidth}
                  y2={endY + 1}
                  stroke="#000"
                  strokeWidth={stringConfig.thickness}
                  opacity="0.65"
                />
                {/* Metal string wire */}
                <line
                  x1="0"
                  y1={startY}
                  x2={neckWidth}
                  y2={endY}
                  stroke="url(#stringGrad)"
                  strokeWidth={stringConfig.thickness}
                  className="stroke-slate-300"
                  style={{
                    stroke: 'linear-gradient(to bottom, #e2e8f0, #94a3b8, #475569)',
                    filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.4))',
                  }}
                />
              </g>
            );
          })}
          
          {/* Custom String Metallic Gradient (defined inside SVG) */}
          <defs>
            <linearGradient id="stringGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#94a3b8" />
              <stop offset="70%" stopColor="#475569" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>

          {/* String Labels on headstock */}
          {BASS_STRINGS.map((str, sIndex) => (
            <text
              key={`label-${sIndex}`}
              x={nutX - 18}
              y={getStringY(sIndex, nutX - 18) + 3}
              fill="rgba(255, 255, 255, 0.4)"
              fontSize="9"
              fontWeight="bold"
              textAnchor="middle"
            >
              {str.name}
            </text>
          ))}

          {/* 7. Interactive Note Nodes */}
          {BASS_STRINGS.map((_, sIndex) =>
            positionsX.map((x, pIndex) => {
              const noteY = getStringY(sIndex, x);
              const noteInfo = getNoteInfo(sIndex, pIndex);
              const noteKey = `${sIndex}_${pIndex}`;

              // Determine visual styling for this node
              const isWrong = guessedWrongNotes.includes(noteKey);
              const isCorrectClick = correctNoteClicked === noteKey;
              
              // If showAnswer is true, we highlight ALL locations of the correct pitch class
              const isCorrectTargetLocation = showAnswer && isCorrectPitchClass(sIndex, pIndex);
              
              // We also want to highlight root notes for structural orientation
              const isRootLocation = isRootPitchClass(sIndex, pIndex);

              // Colors
              let fill = 'transparent';
              let stroke = 'transparent';
              let size = 12;
              let showLabel = showNoteNames;
              let labelColor = 'rgba(255, 255, 255, 0.7)';

              if (isCorrectClick) {
                fill = '#10b981'; // vibrant green
                stroke = '#a7f3d0';
                showLabel = true;
                labelColor = '#ffffff';
              } else if (isWrong) {
                fill = '#f43f5e'; // vibrant rose red
                stroke = '#fecdd3';
                showLabel = true;
                labelColor = '#ffffff';
              } else if (isCorrectTargetLocation) {
                // Highlighted correct notes when failed/showing answer
                fill = '#eab308'; // Amber/Gold
                stroke = '#fef08a';
                showLabel = true;
                labelColor = '#000000';
              } else if (isRootLocation) {
                // Always highlight root notes in a neat indigo glow
                fill = 'rgba(79, 70, 229, 0.85)';
                stroke = 'rgba(199, 210, 254, 0.7)';
                showLabel = true;
                labelColor = '#ffffff';
              } else if (showNoteNames) {
                // Easy Mode: show all notes inside subtle slate circles
                fill = 'rgba(30, 41, 59, 0.9)'; 
                stroke = 'rgba(148, 163, 184, 0.5)';
                size = 11;
                showLabel = true;
                labelColor = 'rgba(248, 250, 252, 0.9)';
              }

              const hasSolidCircle = isCorrectClick || isWrong || isCorrectTargetLocation || isRootLocation || showNoteNames;

              return (
                <g
                  key={`note-${noteKey}`}
                  className="cursor-pointer group"
                  onClick={() => onNoteClick(sIndex, pIndex, noteInfo.midi, noteInfo.name)}
                >
                  {/* Invisible larger click target circle */}
                  <circle
                    cx={pIndex === 0 ? x - 15 : x}
                    cy={noteY}
                    r="15"
                    fill="transparent"
                  />

                  {/* Visual note head indicator */}
                  {hasSolidCircle ? (
                    <circle
                      cx={pIndex === 0 ? x - 15 : x}
                      cy={noteY}
                      r={size}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth="2"
                      style={{
                        transition: 'all 0.2s ease',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                      }}
                    />
                  ) : (
                    // Hover marker (faint circle that lights up on hover)
                    <circle
                      cx={pIndex === 0 ? x - 15 : x}
                      cy={noteY}
                      r="9"
                      fill="rgba(255, 255, 255, 0.05)"
                      stroke="rgba(255, 255, 255, 0.15)"
                      strokeWidth="1"
                      className="group-hover:fill-violet-500/20 group-hover:stroke-violet-300 group-hover:scale-125 transition-all duration-200"
                    />
                  )}

                  {/* Note Label text */}
                  {(showLabel || isCorrectClick || isWrong || isCorrectTargetLocation || isRootLocation) && (
                    <text
                      x={pIndex === 0 ? x - 15 : x}
                      y={noteY + 3.5}
                      fontSize="9.5"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                      fill={labelColor}
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      {noteInfo.name}
                    </text>
                  )}
                </g>
              );
            })
          )}
        </svg>
      </div>
    </div>
  );
};
