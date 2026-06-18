import { useState, useEffect, useCallback, useRef } from 'react';
import { CHORD_ROOTS, getNoteSpelling } from './utils/musicTheory';
import type { ChordRoot, ChordType } from './utils/musicTheory';
import { useSound } from './hooks/useSound';
import { GameDashboard } from './components/GameDashboard';
import { MusicalStaff } from './components/MusicalStaff';
import { DoubleBassNeck } from './components/DoubleBassNeck';
import { SettingsPanel } from './components/SettingsPanel';

export default function App() {
  // Sound Synthesis Hook
  const { playNote, playSuccess, playFailure, setVolume, setMuted } = useSound();

  // Settings State
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

  // Sync volume with synthesizer
  useEffect(() => {
    setVolume(soundVolume);
  }, [soundVolume, setVolume]);

  useEffect(() => {
    setMuted(soundMuted);
  }, [soundMuted, setMuted]);

  // Generate a new interval prompt
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

    // Pick a random interval from selected
    const activeIntervals = selectedIntervals.length > 0 ? selectedIntervals : ['III'];
    const randomInterval = activeIntervals[Math.floor(Math.random() * activeIntervals.length)];

    const targetSpelling = getNoteSpelling(randomRoot, randomChordType, randomInterval);

    setCurrentRoot(randomRoot);
    setCurrentChordType(randomChordType);
    setCurrentInterval(randomInterval);
    setTargetNoteSpelling(targetSpelling);

    // Reset interaction state
    setGameState('GUESSING');
    setGuessedWrongNotes([]);
    setCorrectNoteClicked(null);
  }, [selectedChordTypes, selectedIntervals]);

  // Generate initial question
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
    const cleanTarget = targetNoteSpelling.replace(/[2-4]/g, '');

    const isMatch = cleanNote === cleanTarget;

    if (isMatch) {
      // SUCCESS!
      setCorrectNoteClicked(clickKey);
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
            Learn and master bass intervals. Select chord types and intervals, watch the root note highlight, and click the correct matching pitch class on the neck!
          </p>
        </div>

        {/* Quick controls / Reset */}
        <div className="flex items-center gap-3">
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

      {/* Main Grid Layout */}
      <main className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Dashboard & notation */}
        <div className="col-span-1 md:col-span-6 flex flex-col gap-6 w-full">
          <GameDashboard
            currentRoot={currentRoot}
            currentChordType={currentChordType}
            currentInterval={currentInterval}
            showIntervalNames={showIntervalNames}
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
            showAnswer={gameState === 'SUCCESS' || gameState === 'FAILED_SHOW_ANSWER'}
            isCorrect={gameState === 'SUCCESS'}
          />
        </div>

        {/* Right column: Settings */}
        <div className="col-span-1 md:col-span-6 w-full">
          <SettingsPanel
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
        </div>

        {/* Bottom row: The double bass fingerboard */}
        <div className="col-span-1 md:col-span-12 w-full mt-6 bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-3xl shadow-2xl">
          <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Interactive Fingerboard (Positions 0 - 12)</h3>
            </div>
            <div className="flex gap-4 text-[10px] font-semibold text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-600 border border-indigo-400" /> Root note</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 border border-emerald-300" /> Correct guess</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 border border-rose-300" /> Wrong guess</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 border border-yellow-300" /> Answer hint</span>
            </div>
          </div>

          <DoubleBassNeck
            rootNote={currentRoot}
            targetNoteSpelling={targetNoteSpelling}
            showNoteNames={showNoteNames}
            showRootNotes={showRootNotes}
            showTapes={showTapes}
            showPositionLines={showPositionLines}
            guessedWrongNotes={guessedWrongNotes}
            correctNoteClicked={correctNoteClicked}
            showAnswer={gameState === 'FAILED_SHOW_ANSWER'}
            onNoteClick={handleNoteClick}
          />
        </div>

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
