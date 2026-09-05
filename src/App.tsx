import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CHORD_ROOTS, getNoteSpelling, DEFAULT_MULTI_INTERVALS } from './utils/musicTheory';
import type { ChordRoot, ChordType, PracticeMode } from './utils/musicTheory';
import { useSound } from './hooks/useSound';
import { GameDashboard } from './components/GameDashboard';
import { MusicalStaff } from './components/MusicalStaff';
import { DoubleBassNeck } from './components/DoubleBassNeck';
import { SettingsPanel } from './components/SettingsPanel';

export default function App() {
  // Sound Synthesis Hook
  const { playNote, playSuccess, playFailure, playFoundNote, setVolume, setMuted } = useSound();

  // Practice Mode State
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('single');
  const [multiNoteIntervals, setMultiNoteIntervals] = useState<string[]>(DEFAULT_MULTI_INTERVALS);

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
  const [showRootNotes, setShowRootNotes] = useState(true);
  const [showIntervalNames, setShowIntervalNames] = useState(true);
  const [showTapes, setShowTapes] = useState(true);
  const [showPositionLines, setShowPositionLines] = useState(true);
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

  // Multi-note progress tracking
  const [foundIntervals, setFoundIntervals] = useState<string[]>([]);
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

  // Target note spellings for multi-note matching and display
  const multiTargetSpellings = useMemo(() => {
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

    // Pick a random root
    const randomRoot = CHORD_ROOTS[Math.floor(Math.random() * CHORD_ROOTS.length)];
    
    // Pick a random chord type from selected
    const activeChordTypes = selectedChordTypes.length > 0 ? selectedChordTypes : (['min7'] as ChordType[]);
    const randomChordType = activeChordTypes[Math.floor(Math.random() * activeChordTypes.length)];

    if (practiceMode === 'multi') {
      const activeMulti = multiNoteIntervals.length > 0 ? multiNoteIntervals : DEFAULT_MULTI_INTERVALS;
      const firstInt = activeMulti[0] || 'III';
      const firstSpelling = getNoteSpelling(randomRoot, randomChordType, firstInt);

      setCurrentRoot(randomRoot);
      setCurrentChordType(randomChordType);
      setCurrentInterval(firstInt);
      setTargetNoteSpelling(firstSpelling);
      setFoundIntervals([]);
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
      setCorrectNotesClicked([]);
    }

    // Reset interaction state
    setGameState('GUESSING');
    setGuessedWrongNotes([]);
    setCorrectNoteClicked(null);
  }, [selectedChordTypes, selectedIntervals, practiceMode, multiNoteIntervals]);

  // Generate initial question or regenerate when mode changes
  useEffect(() => {
    generateQuestion();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [generateQuestion]);

  // Handle note clicks on the neck
  const handleNoteClick = (stringIndex: number, position: number, midiPitch: number, noteName: string) => {
    // Play pitch
    playNote(midiPitch);

    // If already solved or shown, ignore further score-altering clicks
    if (gameState === 'SUCCESS' || gameState === 'FAILED_SHOW_ANSWER') return;

    const clickKey = `${stringIndex}_${position}`;
    // Extract base pitch class (C=0, C#/Db=1, etc.)
    const cleanNote = noteName.replace(/[2-4]/g, '');

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
            Learn and master bass intervals and chord arpeggios. Switch between Single Interval and Multi-Note chord tone practice!
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
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Interactive Fingerboard (Positions 0 - 12)</h3>
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-4 text-[10px] font-semibold text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-600 border border-indigo-400" /> Root note</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 border border-emerald-300" /> Correct guess</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 border border-rose-300" /> Wrong guess</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 border border-yellow-300" /> Answer hint</span>
            </div>
          </div>

          <DoubleBassNeck
            rootNote={currentRoot}
            targetNoteSpelling={targetNoteSpelling}
            targetNoteSpellings={multiTargetSpellings}
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

        {/* 2. Middle Row: Dashboard (left) & Notation Staff (right) */}
        <section aria-label="Dashboard and Notation" className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <GameDashboard
            currentRoot={currentRoot}
            currentChordType={currentChordType}
            currentInterval={currentInterval}
            showIntervalNames={showIntervalNames}
            practiceMode={practiceMode}
            targetIntervals={multiNoteIntervals}
            foundIntervals={foundIntervals}
            onModeChange={setPracticeMode}
            gameState={gameState}
            score={score}
            streak={streak}
            highScore={highScore}
            totalAttempts={totalAttempts}
            correctAnswers={correctAnswers}
            onNextQuestion={handleNextQuestion}
          />
          <MusicalStaff
            rootNote={currentRoot}
            chordType={currentChordType}
            targetInterval={currentInterval}
            targetIntervals={practiceMode === 'multi' ? multiNoteIntervals : undefined}
            foundIntervals={foundIntervals}
            showAnswer={gameState === 'SUCCESS' || gameState === 'FAILED_SHOW_ANSWER'}
            isCorrect={gameState === 'SUCCESS'}
          />
        </section>

        {/* 3. Bottom Row: Practice Settings (Collapsible) */}
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
