import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CHORD_ROOTS, getNoteSpelling, DEFAULT_MULTI_INTERVALS, LIVE_TARGET_INTERVALS, getChordMidis, getChordTones, ROOT_WRITTEN_MIDIS, getPitchClass, soundingMidiToNeckMidi } from './utils/musicTheory';
import type { ChordRoot, ChordType, PracticeMode } from './utils/musicTheory';
import { useSound } from './hooks/useSound';
import { usePitchDetection } from './hooks/usePitchDetection';
import { midiToFreq } from './utils/pitchDetection';
import type { DetectedPitch } from './utils/pitchDetection';
import { GameDashboard } from './components/GameDashboard';
import { MusicalStaff } from './components/MusicalStaff';
import { DoubleBassNeck } from './components/DoubleBassNeck';
import { SettingsPanel } from './components/SettingsPanel';

export default function App() {
  // Sound Synthesis Hook
  const { playNote, playSuccess, playFailure, playFoundNote, playArpeggio, setVolume, setMuted } = useSound();

  // Practice Mode State
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('single');
  const [multiNoteIntervals, setMultiNoteIntervals] = useState<string[]>(DEFAULT_MULTI_INTERVALS);

  // Reference Mode State
  const [referenceIntervalFilter, setReferenceIntervalFilter] = useState<'all' | 'root' | 'guide' | 'triad'>('all');
  const [referenceLabelType, setReferenceLabelType] = useState<'notes' | 'intervals'>('notes');
  const [activeReferenceClickedKey, setActiveReferenceClickedKey] = useState<string | null>(null);
  const [lastPlayedInfo, setLastPlayedInfo] = useState<string | null>(null);

  // Settings State
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(() => {
    const saved = localStorage.getItem('dbass_settings_collapsed');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleSettingsCollapsed = () => {
    setIsSettingsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('dbass_settings_collapsed', String(next));
      return next;
    });
  };

  const [showNoteNames, setShowNoteNames] = useState(false);
  const [showRootNotes, setShowRootNotes] = useState(false);
  const [showIntervalNames, setShowIntervalNames] = useState(true);
  const [showTapes, setShowTapes] = useState(true);
  const [showPositionLines, setShowPositionLines] = useState(true);
  const [showStaffNotation, setShowStaffNotation] = useState(() => {
    const saved = localStorage.getItem('dbass_show_staff_notation');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggleStaffNotation = (val: boolean) => {
    setShowStaffNotation(val);
    localStorage.setItem('dbass_show_staff_notation', String(val));
  };

  const [soundVolume, setSoundVolume] = useState(0.6);
  const [soundMuted, setSoundMuted] = useState(false);

  // Practicing subsets
  const [selectedChordTypes, setSelectedChordTypes] = useState<ChordType[]>(['Maj7', 'min7', '7']);
  const [selectedIntervals, setSelectedIntervals] = useState<string[]>(['I', 'III', 'V', 'VII']);

  // Game/Question State
  const [currentRoot, setCurrentRoot] = useState<ChordRoot>('C');
  const [currentChordType, setCurrentChordType] = useState<ChordType>('min7');
  const [currentInterval, setCurrentInterval] = useState<string>('III');
  const [targetNoteSpelling, setTargetNoteSpelling] = useState<string>('Eb');

  // Multi-note & Live-play progress tracking
  const [foundIntervals, setFoundIntervals] = useState<string[]>([]);
  const [foundToneMidis, setFoundToneMidis] = useState<number[]>([]);
  const [correctNotesClicked, setCorrectNotesClicked] = useState<string[]>([]);

  const [gameState, setGameState] = useState<'GUESSING' | 'SUCCESS' | 'TRY_AGAIN' | 'FAILED_SHOW_ANSWER'>('GUESSING');
  const [guessedWrongNotes, setGuessedWrongNotes] = useState<string[]>([]);
  const [correctNoteClicked, setCorrectNoteClicked] = useState<string | null>(null);

  // Score stats
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('dbass_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  // Auto-advance timer reference
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Target note spellings for multi-note and live-play matching and display
  const multiTargetSpellings = useMemo(() => {
    if (practiceMode === 'live') {
      return LIVE_TARGET_INTERVALS.map(interval => getNoteSpelling(currentRoot, currentChordType, interval));
    }
    if (practiceMode !== 'multi') return [targetNoteSpelling];
    return multiNoteIntervals.map(interval => getNoteSpelling(currentRoot, currentChordType, interval));
  }, [practiceMode, multiNoteIntervals, currentRoot, currentChordType, targetNoteSpelling]);

  // Sync volume with synthesizer
  useEffect(() => {
    setVolume(soundVolume);
  }, [soundVolume, setVolume]);

  useEffect(() => {
    setMuted(soundMuted);
  }, [soundMuted, setMuted]);

  // Generate a new interval / chord prompt
  const generateQuestion = useCallback(() => {
    // Clear any pending timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // In reference mode, user freely explores chords
    if (practiceMode === 'reference') {
      return;
    }

    // Pick a random root
    const randomRoot = CHORD_ROOTS[Math.floor(Math.random() * CHORD_ROOTS.length)];
    
    // Pick a random chord type from selected
    const activeChordTypes = selectedChordTypes.length > 0 ? selectedChordTypes : (['min7'] as ChordType[]);
    const randomChordType = activeChordTypes[Math.floor(Math.random() * activeChordTypes.length)];

    if (practiceMode === 'live') {
      const firstInt = 'I';
      const firstSpelling = getNoteSpelling(randomRoot, randomChordType, firstInt);

      setCurrentRoot(randomRoot);
      setCurrentChordType(randomChordType);
      setCurrentInterval(firstInt);
      setTargetNoteSpelling(firstSpelling);
      setFoundIntervals([]);
      setFoundToneMidis([]);
      setCorrectNotesClicked([]);
    } else if (practiceMode === 'multi') {
      const activeMulti = multiNoteIntervals.length > 0 ? multiNoteIntervals : DEFAULT_MULTI_INTERVALS;
      const firstInt = activeMulti[0] || 'III';
      const firstSpelling = getNoteSpelling(randomRoot, randomChordType, firstInt);

      setCurrentRoot(randomRoot);
      setCurrentChordType(randomChordType);
      setCurrentInterval(firstInt);
      setTargetNoteSpelling(firstSpelling);
      setFoundIntervals([]);
      setFoundToneMidis([]);
      setCorrectNotesClicked([]);
    } else {
      // Single interval mode
      const activeIntervals = selectedIntervals.length > 0 ? selectedIntervals : ['III'];
      const randomInterval = activeIntervals[Math.floor(Math.random() * activeIntervals.length)];
      const targetSpelling = getNoteSpelling(randomRoot, randomChordType, randomInterval);

      setCurrentRoot(randomRoot);
      setCurrentChordType(randomChordType);
      setCurrentInterval(randomInterval);
      setTargetNoteSpelling(targetSpelling);
      setFoundIntervals([]);
      setFoundToneMidis([]);
      setCorrectNotesClicked([]);
    }

    // Reset interaction state
    setGameState('GUESSING');
    setGuessedWrongNotes([]);
    setCorrectNoteClicked(null);
    setClickedPitch(null);
  }, [selectedChordTypes, selectedIntervals, practiceMode, multiNoteIntervals]);

  // Generate initial question or regenerate when mode changes
  useEffect(() => {
    generateQuestion();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [generateQuestion]);

  // Pitch detection for live play mode
  const handleLiveNoteDetected = useCallback((detected: DetectedPitch) => {
    if (practiceMode !== 'live') return;
    if (gameState === 'SUCCESS') return;

    // Strictly wait for next chord tone in order: Root ('I') -> 3rd ('III') -> 5th ('V') -> 7th ('VII')
    const targets = LIVE_TARGET_INTERVALS;
    const nextIndex = foundIntervals.length;
    if (nextIndex >= targets.length) return;

    const currentTargetInterval = targets[nextIndex];
    const targetSpelling = getNoteSpelling(currentRoot, currentChordType, currentTargetInterval);
    const targetPitchClass = getPitchClass(targetSpelling);

    // Validate on ANY octave (pitchClass comparison 0-11)
    if (detected.pitchClass === targetPitchClass) {
      // Map sounding bass pitch to written neck MIDI in positions 0-12
      const neckMidi = soundingMidiToNeckMidi(detected.midi);
      const nextFound = [...foundIntervals, currentTargetInterval];
      setFoundIntervals(nextFound);
      setFoundToneMidis(prev => [...prev, neckMidi]);

      // Check if all 4 chord tones found
      if (nextFound.length >= targets.length) {
        setGameState('SUCCESS');
        playSuccess();

        const points = 30;
        setScore(prev => {
          const newScore = prev + points;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('dbass_highscore', newScore.toString());
          }
          return newScore;
        });

        setStreak(prev => prev + 1);
        setCorrectAnswers(prev => prev + 1);
        setTotalAttempts(prev => prev + 1);

        // Auto-advance after 2.2 seconds
        timerRef.current = setTimeout(() => {
          generateQuestion();
        }, 2200);
      } else {
        // Play chime for note found
        playFoundNote();
      }
    }
    // Wrong note played: do nothing! No errors, no fail sounds, no shake. The app waits for the right note.
  }, [practiceMode, gameState, currentRoot, currentChordType, foundIntervals, highScore, playSuccess, playFoundNote, generateQuestion]);

  // Real-time microphone pitch detection hook
  const {
    isListening: isLiveListening,
    inputLevel: liveInputLevel,
    currentPitch: detectedLivePitch,
    permissionError: livePermissionError,
    startListening: startLiveListening,
    stopListening: stopLiveListening,
    toggleListening: toggleLiveListening,
  } = usePitchDetection({
    onNoteDetected: handleLiveNoteDetected,
  });

  const [clickedPitch, setClickedPitch] = useState<DetectedPitch | null>(null);
  const liveCurrentPitch = detectedLivePitch ?? clickedPitch;

  // Automatically manage microphone when entering or leaving Live Play mode
  useEffect(() => {
    if (practiceMode === 'live') {
      startLiveListening();
    } else {
      stopLiveListening();
    }
  }, [practiceMode, startLiveListening, stopLiveListening]);

  // Reference mode audio & chord helpers
  const handlePlayArpeggio = useCallback(() => {
    const midis = getChordMidis(currentRoot, currentChordType);
    playArpeggio(midis);
    setLastPlayedInfo(`🎶 Playing arpeggio: ${currentRoot}${currentChordType}`);
  }, [currentRoot, currentChordType, playArpeggio]);

  const handlePlaySingleTone = useCallback((spelling: string) => {
    const tones = getChordTones(currentRoot, currentChordType);
    const tone = tones.find(t => t.spelling === spelling);
    const baseMidi = ROOT_WRITTEN_MIDIS[currentRoot] ?? 48;
    const midi = tone ? baseMidi + tone.semitones : 48;
    playNote(midi);
    if (tone) {
      setLastPlayedInfo(`🎵 Played: ${tone.spelling} (${tone.label} - ${tone.fullName})`);
    }
  }, [currentRoot, currentChordType, playNote]);

  const handleRandomChord = useCallback(() => {
    const randomRoot = CHORD_ROOTS[Math.floor(Math.random() * CHORD_ROOTS.length)];
    const chordTypes: ChordType[] = ['Maj7', 'min7', '7', 'ø7', 'o7'];
    const randomType = chordTypes[Math.floor(Math.random() * chordTypes.length)];
    setCurrentRoot(randomRoot);
    setCurrentChordType(randomType);
    setActiveReferenceClickedKey(null);
    setLastPlayedInfo(null);
  }, []);

  // Handle note clicks on the neck
  const handleNoteClick = (stringIndex: number, position: number, midiPitch: number, noteName: string) => {
    // Play pitch
    playNote(midiPitch);

    const clickKey = `${stringIndex}_${position}`;
    // Extract base pitch class (C=0, C#/Db=1, etc.)
    const cleanNote = noteName.replace(/[2-4]/g, '');

    // Reference mode: exploratory without game score or timer penalties
    if (practiceMode === 'reference') {
      setActiveReferenceClickedKey(clickKey);
      const tones = getChordTones(currentRoot, currentChordType);
      const matchedTone = tones.find(t => {
        const cleanSpelling = t.spelling.replace(/[2-4]/g, '');
        return cleanNote === cleanSpelling;
      });

      if (matchedTone) {
        setLastPlayedInfo(`🎵 Played: ${noteName} (${matchedTone.label} - ${matchedTone.fullName})`);
      } else {
        setLastPlayedInfo(`🎵 Played: ${noteName} (Non-chord tone)`);
      }
      return;
    }

    // If already solved or shown, ignore further score-altering clicks
    if (gameState === 'SUCCESS' || gameState === 'FAILED_SHOW_ANSWER') return;

    if (practiceMode === 'live') {
      // Update tuner with clicked note preview
      // midiPitch from the neck is written MIDI (40-67). Convert to sounding MIDI for double bass.
      const soundingMidi = midiPitch - 12;
      const oct = Math.floor(soundingMidi / 12) - 1;
      setClickedPitch({
        freq: Math.round(midiToFreq(soundingMidi) * 10) / 10,
        confidence: 1,
        midi: soundingMidi,
        cents: 0,
        pitchClass: getPitchClass(cleanNote),
        noteName: cleanNote,
        octave: oct,
        rms: 0.1,
      });

      const targets = LIVE_TARGET_INTERVALS;
      const nextIndex = foundIntervals.length;
      if (nextIndex < targets.length) {
        const currentTargetInterval = targets[nextIndex];
        const targetSpelling = getNoteSpelling(currentRoot, currentChordType, currentTargetInterval);
        const targetPitchClass = getPitchClass(targetSpelling);

        if (getPitchClass(cleanNote) === targetPitchClass) {
          const nextFound = [...foundIntervals, currentTargetInterval];
          setFoundIntervals(nextFound);
          setFoundToneMidis(prev => [...prev, midiPitch]);

          if (nextFound.length >= targets.length) {
            setGameState('SUCCESS');
            playSuccess();

            const points = 30;
            setScore(prev => {
              const newScore = prev + points;
              if (newScore > highScore) {
                setHighScore(newScore);
                localStorage.setItem('dbass_highscore', newScore.toString());
              }
              return newScore;
            });

            setStreak(prev => prev + 1);
            setCorrectAnswers(prev => prev + 1);
            setTotalAttempts(prev => prev + 1);

            timerRef.current = setTimeout(() => {
              generateQuestion();
            }, 2200);
          } else {
            playFoundNote();
          }
        }
      }
      return;
    }

    if (practiceMode === 'multi') {
      // Multi-note mode: check if note matches ANY of the target chord tone intervals
      const matchingTarget = multiNoteIntervals.find(interval => {
        const spelling = getNoteSpelling(currentRoot, currentChordType, interval);
        return cleanNote === spelling.replace(/[2-4]/g, '');
      });

      if (matchingTarget) {
        // If this interval was already found, don't penalize
        if (foundIntervals.includes(matchingTarget)) {
          return;
        }

        const nextFound = [...foundIntervals, matchingTarget];
        setFoundIntervals(nextFound);
        setCorrectNotesClicked(prev => (prev.includes(clickKey) ? prev : [...prev, clickKey]));

        // Check if all chord tones found
        if (nextFound.length >= multiNoteIntervals.length) {
          // Completed the chord!
          setGameState('SUCCESS');
          playSuccess();

          const isClean = guessedWrongNotes.length === 0;
          const points = isClean ? 25 : 15;

          setScore(prev => {
            const newScore = prev + points;
            if (newScore > highScore) {
              setHighScore(newScore);
              localStorage.setItem('dbass_highscore', newScore.toString());
            }
            return newScore;
          });

          if (isClean) {
            setStreak(prev => prev + 1);
            setCorrectAnswers(prev => prev + 1);
          }
          setTotalAttempts(prev => prev + 1);

          // Auto-advance after 2.2 seconds
          timerRef.current = setTimeout(() => {
            generateQuestion();
          }, 2200);
        } else {
          // Play chime for note found
          playFoundNote();
        }
      } else {
        // Wrong note for this chord
        playFailure();
        setStreak(0);

        if (guessedWrongNotes.length === 0) {
          // First try failure -> allow second chance
          setGuessedWrongNotes([clickKey]);
          setGameState('TRY_AGAIN');
        } else {
          // Second try failure -> show answer
          setGuessedWrongNotes(prev => [...prev, clickKey]);
          setGameState('FAILED_SHOW_ANSWER');
          setTotalAttempts(prev => prev + 1);

          // Auto-advance after 4 seconds
          timerRef.current = setTimeout(() => {
            generateQuestion();
          }, 4000);
        }
      }
    } else {
      // Single Mode
      const cleanTarget = targetNoteSpelling.replace(/[2-4]/g, '');
      const isMatch = cleanNote === cleanTarget;

      if (isMatch) {
        // SUCCESS!
        setCorrectNoteClicked(clickKey);
        setCorrectNotesClicked([clickKey]);
        setGameState('SUCCESS');
        playSuccess();

        // Score logic
        const isFirstTry = guessedWrongNotes.length === 0;
        const points = isFirstTry ? 10 : 5;
        
        setScore(prev => {
          const newScore = prev + points;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('dbass_highscore', newScore.toString());
          }
          return newScore;
        });

        if (isFirstTry) {
          setStreak(prev => prev + 1);
          setCorrectAnswers(prev => prev + 1);
        }
        setTotalAttempts(prev => prev + 1);

        // Auto-advance after 1.8 seconds
        timerRef.current = setTimeout(() => {
          generateQuestion();
        }, 1800);

      } else {
        // WRONG ANSWER
        playFailure();
        setStreak(0);

        // Check if first failure or second
        if (guessedWrongNotes.length === 0) {
          // First try failure -> allow second chance
          setGuessedWrongNotes([clickKey]);
          setGameState('TRY_AGAIN');
        } else {
          // Second try failure -> show answer
          setGuessedWrongNotes(prev => [...prev, clickKey]);
          setGameState('FAILED_SHOW_ANSWER');
          setTotalAttempts(prev => prev + 1);

          // Auto-advance after 3.5 seconds so user can see correct answers
          timerRef.current = setTimeout(() => {
            generateQuestion();
          }, 3500);
        }
      }
    }
  };

  const handleNextQuestion = () => {
    generateQuestion();
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 font-sans flex flex-col items-center p-4 sm:p-6 md:p-8 selection:bg-violet-500/30 selection:text-violet-200">
      
      {/* Header */}
      <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex flex-col text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
            Double Bass Interval Trainer
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-lg font-medium">
            Learn and master bass intervals, chord arpeggios, and live instrument playing. Switch between Single Interval, Multi-Note, Reference, and Live Play mode!
          </p>
        </div>

        {/* Quick controls: Settings toggle & Reset */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSettingsCollapsed}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-all active:scale-95 flex items-center gap-2"
            title="Toggle Practice Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-violet-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            <span>{isSettingsCollapsed ? 'Settings' : 'Close'}</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to reset your score?')) {
                setScore(0);
                setStreak(0);
                setTotalAttempts(0);
                setCorrectAnswers(0);
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-xs font-bold uppercase tracking-wider text-rose-400/90 transition-all active:scale-95"
          >
            Reset Scores
          </button>
        </div>
      </header>

      {/* Main Layout Flow */}
      <main className="w-full max-w-6xl flex flex-col gap-6">
        
        {/* 1. Interactive Fingerboard (Neck) ON TOP */}
        <section aria-label="Interactive Double Bass Fingerboard" className="w-full bg-white/5 border border-white/10 backdrop-blur-xl p-4 sm:p-6 rounded-3xl shadow-2xl">
          <div className="flex flex-wrap justify-between items-center border-b border-white/10 pb-3 mb-4 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shadow-indigo-glow inline-block shrink-0" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Interactive Fingerboard (Positions 0 - 12)</h3>
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-4 text-[10px] font-semibold text-slate-300">
              {practiceMode === 'reference' ? (
                <>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 border border-indigo-300 shadow-indigo-glow inline-block shrink-0" /> Root (1)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-300 shadow-emerald-glow inline-block shrink-0" /> 3rd</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500 border border-cyan-300 shadow-cyan-glow inline-block shrink-0" /> 5th</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 border border-purple-300 shadow-purple-glow inline-block shrink-0" /> 7th</span>
                </>
              ) : practiceMode === 'live' ? (
                <>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500 border border-cyan-300 shadow-[0_0_8px_#06b6d4] inline-block shrink-0" /> Note being played</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-300 shadow-emerald-glow inline-block shrink-0" /> Found chord tone</span>
                  {showRootNotes && (
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600 border border-indigo-400 shadow-indigo-glow inline-block shrink-0" /> Root note</span>
                  )}
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600 border border-indigo-400 shadow-indigo-glow inline-block shrink-0" /> Root note</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-300 shadow-emerald-glow inline-block shrink-0" /> Correct guess</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-300 shadow-rose-glow inline-block shrink-0" /> Wrong note</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 border border-yellow-300 shadow-yellow-glow inline-block shrink-0" /> Answer hint</span>
                </>
              )}
            </div>
          </div>

          <DoubleBassNeck
            rootNote={currentRoot}
            currentChordType={currentChordType}
            practiceMode={practiceMode}
            referenceIntervalFilter={referenceIntervalFilter}
            referenceLabelType={referenceLabelType}
            activeReferenceClickedKey={activeReferenceClickedKey}
            targetNoteSpelling={targetNoteSpelling}
            targetNoteSpellings={multiTargetSpellings}
            foundIntervals={foundIntervals}
            foundToneMidis={foundToneMidis}
            livePlayingMidi={practiceMode === 'live' && liveCurrentPitch ? soundingMidiToNeckMidi(liveCurrentPitch.midi) : null}
            showNoteNames={showNoteNames}
            showRootNotes={showRootNotes}
            showTapes={showTapes}
            showPositionLines={showPositionLines}
            guessedWrongNotes={guessedWrongNotes}
            correctNoteClicked={correctNoteClicked}
            correctNotesClicked={correctNotesClicked}
            showAnswer={gameState === 'FAILED_SHOW_ANSWER'}
            onNoteClick={handleNoteClick}
          />
        </section>

        {/* 2. Main Dashboard (Full Width) */}
        <section aria-label="Dashboard" className="w-full">
          <GameDashboard
            currentRoot={currentRoot}
            currentChordType={currentChordType}
            currentInterval={currentInterval}
            showIntervalNames={showIntervalNames}
            practiceMode={practiceMode}
            targetIntervals={practiceMode === 'live' ? LIVE_TARGET_INTERVALS : multiNoteIntervals}
            foundIntervals={foundIntervals}
            onModeChange={setPracticeMode}
            onRootChange={setCurrentRoot}
            onChordTypeChange={setCurrentChordType}
            referenceIntervalFilter={referenceIntervalFilter}
            onIntervalFilterChange={setReferenceIntervalFilter}
            referenceLabelType={referenceLabelType}
            onLabelTypeChange={setReferenceLabelType}
            onPlayArpeggio={handlePlayArpeggio}
            onPlaySingleTone={handlePlaySingleTone}
            lastPlayedInfo={lastPlayedInfo}
            onRandomChord={handleRandomChord}
            isLiveListening={isLiveListening}
            onToggleLiveListening={toggleLiveListening}
            liveCurrentPitch={liveCurrentPitch}
            liveInputLevel={liveInputLevel}
            livePermissionError={livePermissionError}
            gameState={gameState}
            score={score}
            streak={streak}
            highScore={highScore}
            totalAttempts={totalAttempts}
            correctAnswers={correctAnswers}
            onNextQuestion={handleNextQuestion}
          />
        </section>

        {/* 3. Musical Notation (Placed below dashboard, display controlled by config) */}
        {showStaffNotation && (
          <section aria-label="Musical Staff Notation" className="w-full max-w-2xl mx-auto">
            <MusicalStaff
              rootNote={currentRoot}
              chordType={currentChordType}
              targetInterval={practiceMode === 'reference' || practiceMode === 'live' ? 'III' : currentInterval}
              targetIntervals={
                practiceMode === 'reference'
                  ? ['III', 'V', 'VII']
                  : practiceMode === 'live'
                  ? LIVE_TARGET_INTERVALS
                  : (practiceMode === 'multi' ? multiNoteIntervals : undefined)
              }
              foundIntervals={practiceMode === 'reference' ? ['III', 'V', 'VII'] : foundIntervals}
              showAnswer={practiceMode === 'reference' ? true : (gameState === 'SUCCESS' || gameState === 'FAILED_SHOW_ANSWER')}
              isCorrect={practiceMode === 'reference' ? true : (gameState === 'SUCCESS')}
            />
          </section>
        )}

        {/* 4. Bottom Row: Practice Settings (Collapsible) */}
        <SettingsPanel
          isCollapsed={isSettingsCollapsed}
          onToggleCollapse={toggleSettingsCollapsed}
          practiceMode={practiceMode}
          setPracticeMode={setPracticeMode}
          multiNoteIntervals={multiNoteIntervals}
          setMultiNoteIntervals={setMultiNoteIntervals}
          showNoteNames={showNoteNames}
          setShowNoteNames={setShowNoteNames}
          showRootNotes={showRootNotes}
          setShowRootNotes={setShowRootNotes}
          showIntervalNames={showIntervalNames}
          setShowIntervalNames={setShowIntervalNames}
          showTapes={showTapes}
          setShowTapes={setShowTapes}
          showPositionLines={showPositionLines}
          setShowPositionLines={setShowPositionLines}
          showStaffNotation={showStaffNotation}
          setShowStaffNotation={handleToggleStaffNotation}
          volume={soundVolume}
          setVolume={setSoundVolume}
          isMuted={soundMuted}
          setIsMuted={setSoundMuted}
          selectedChordTypes={selectedChordTypes}
          setSelectedChordTypes={setSelectedChordTypes}
          selectedIntervals={selectedIntervals}
          setSelectedIntervals={setSelectedIntervals}
        />

      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500 text-xs">
        <span>&copy; {new Date().getFullYear()} Double Bass Interval Master. Pure client-side application.</span>
        <div className="flex gap-4 font-medium">
          <span className="hover:text-slate-400 transition-colors">Tuned in Fourths (E-A-D-G)</span>
          <span>&bull;</span>
          <span className="hover:text-slate-400 transition-colors">Web Audio pluck synthesis</span>
        </div>
      </footer>

    </div>
  );
}
