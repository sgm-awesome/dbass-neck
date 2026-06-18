import React from 'react';
import { CHORD_DEFINITIONS, getIntervalName, getNoteSpelling } from '../utils/musicTheory';
import type { ChordRoot, ChordType } from '../utils/musicTheory';

interface GameDashboardProps {
  currentRoot: ChordRoot;
  currentChordType: ChordType;
  currentInterval: string;
  
  gameState: 'GUESSING' | 'SUCCESS' | 'TRY_AGAIN' | 'FAILED_SHOW_ANSWER';
  score: number;
  streak: number;
  highScore: number;
  totalAttempts: number;
  correctAnswers: number;
  
  onNextQuestion: () => void;
}

export const GameDashboard: React.FC<GameDashboardProps> = ({
  currentRoot,
  currentChordType,
  currentInterval,
  gameState,
  score,
  streak,
  highScore,
  totalAttempts,
  correctAnswers,
  onNextQuestion,
}) => {
  const chordDef = CHORD_DEFINITIONS[currentChordType];
  const intervalName = getIntervalName(currentInterval, currentChordType);
  const targetNote = getNoteSpelling(currentRoot, currentChordType, currentInterval);

  // Compute accuracy
  const accuracy = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 100;

  // Visual card styles based on game state
  let feedbackText = '';
  let feedbackSubtext = '';
  let cardBorderClass = 'border-white/10';
  let cardBgClass = 'bg-white/5';
  let glowColor = 'rgba(255, 255, 255, 0.05)';

  if (gameState === 'SUCCESS') {
    feedbackText = 'Excellent! 🎉';
    feedbackSubtext = `Correct note is indeed ${targetNote}. Moving on...`;
    cardBorderClass = 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]';
    cardBgClass = 'bg-emerald-950/10';
    glowColor = 'rgba(16, 185, 129, 0.1)';
  } else if (gameState === 'TRY_AGAIN') {
    feedbackText = 'Not Quite... 🔍';
    feedbackSubtext = 'Wrong position! You have one more attempt.';
    cardBorderClass = 'border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.15)] animate-wobble';
    cardBgClass = 'bg-rose-950/10';
    glowColor = 'rgba(244, 63, 94, 0.1)';
  } else if (gameState === 'FAILED_SHOW_ANSWER') {
    feedbackText = 'Second Mistake 💡';
    feedbackSubtext = `The correct note ${targetNote} is highlighted in Gold on the neck.`;
    cardBorderClass = 'border-amber-500/40 shadow-[0_0_20px_rgba(234,179,8,0.15)]';
    cardBgClass = 'bg-amber-950/10';
    glowColor = 'rgba(234, 179, 8, 0.1)';
  } else {
    feedbackText = 'Your Turn...';
    feedbackSubtext = 'Click the matching note on the neck!';
  }

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Upper score row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Score Card */}
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Score</span>
          <span className="text-xl font-bold font-mono text-violet-300">{score}</span>
        </div>

        {/* Streak Card */}
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md relative overflow-hidden">
          {streak >= 3 && (
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-violet-500/10 animate-pulse pointer-events-none" />
          )}
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
            Streak {streak >= 3 && '🔥'}
          </span>
          <span className={`text-xl font-bold font-mono transition-transform ${streak >= 3 ? 'text-fuchsia-400 scale-110' : 'text-slate-200'}`}>
            {streak}
          </span>
        </div>

        {/* Accuracy Card */}
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Accuracy</span>
          <span className="text-xl font-bold font-mono text-slate-200">{accuracy}%</span>
        </div>
      </div>

      {/* Main Chord display Card */}
      <div 
        className={`relative flex flex-col items-center justify-center p-8 rounded-3xl border ${cardBorderClass} ${cardBgClass} transition-all duration-300`}
        style={{
          boxShadow: `inset 0 0 30px ${glowColor}, 0 20px 40px rgba(0, 0, 0, 0.4)`,
        }}
      >
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
          HighScore: {highScore}
        </div>

        {/* Chord Symbol */}
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            {currentRoot}
          </span>
          <span className="text-3xl font-extrabold text-violet-400 font-mono">
            {chordDef.symbol}
          </span>
        </div>

        <div className="text-xs text-slate-400 font-semibold mb-6">
          {currentRoot} {chordDef.fullName}
        </div>

        {/* Prompt Instruction */}
        <div className="text-center flex flex-col items-center gap-2 mb-4">
          <div className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">Find Interval</div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
              {currentInterval}
            </span>
            <span className="text-lg text-slate-300 font-medium">
              ({intervalName})
            </span>
          </div>
        </div>

        {/* Visual feedback banner */}
        <div className="w-full flex flex-col items-center justify-center min-h-[50px] border-t border-white/5 mt-4 pt-4 text-center">
          <span className={`text-sm font-bold tracking-wide transition-all ${
            gameState === 'SUCCESS' ? 'text-emerald-400' :
            gameState === 'TRY_AGAIN' ? 'text-rose-400' :
            gameState === 'FAILED_SHOW_ANSWER' ? 'text-amber-400' : 'text-slate-400'
          }`}>
            {feedbackText}
          </span>
          <span className="text-xs text-slate-400 mt-1 max-w-[240px]">
            {feedbackSubtext}
          </span>
        </div>

        {/* Next Question buttons / Manual overrides */}
        {(gameState === 'SUCCESS' || gameState === 'FAILED_SHOW_ANSWER') && (
          <button
            onClick={onNextQuestion}
            className="mt-5 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-bold text-xs uppercase tracking-wider shadow-[0_4px_12px_rgba(124,58,237,0.3)] transition-all duration-150 hover:scale-[1.03] active:scale-[0.98]"
          >
            Next Interval
          </button>
        )}
      </div>
    </div>
  );
};
