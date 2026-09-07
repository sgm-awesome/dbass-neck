import React from 'react';
import { CHORD_DEFINITIONS, CHORD_ROOTS, getIntervalName, getNoteSpelling, getChordTones } from '../utils/musicTheory';
import type { ChordRoot, ChordType, PracticeMode } from '../utils/musicTheory';
import type { DetectedPitch } from '../utils/pitchDetection';

interface GameDashboardProps {
  currentRoot: ChordRoot;
  currentChordType: ChordType;
  currentInterval: string;
  showIntervalNames: boolean; // settings: show descriptive names
  practiceMode: PracticeMode;
  targetIntervals?: string[];
  foundIntervals?: string[];
  onModeChange?: (mode: PracticeMode) => void;

  // Reference mode props
  onRootChange?: (root: ChordRoot) => void;
  onChordTypeChange?: (type: ChordType) => void;
  referenceIntervalFilter?: 'all' | 'root' | 'guide' | 'triad';
  onIntervalFilterChange?: (filter: 'all' | 'root' | 'guide' | 'triad') => void;
  referenceLabelType?: 'notes' | 'intervals';
  onLabelTypeChange?: (type: 'notes' | 'intervals') => void;
  onPlayArpeggio?: () => void;
  onPlaySingleTone?: (spelling: string) => void;
  lastPlayedInfo?: string | null;
  onRandomChord?: () => void;

  // Live mode props
  isLiveListening?: boolean;
  onToggleLiveListening?: () => void;
  liveCurrentPitch?: DetectedPitch | null;
  liveInputLevel?: number;
  livePermissionError?: string | null;
  liveErrorsCount?: number;
  
  gameState: 'GUESSING' | 'SUCCESS' | 'TRY_AGAIN' | 'FAILED_SHOW_ANSWER';
  score: number;
  streak: number;
  highScore: number;
  totalAttempts: number;
  correctAnswers: number;
  
  onNextQuestion: () => void;
}

const getChordFormula = (type: ChordType): string => {
  switch (type) {
    case 'Maj7': return '1 - 3 - 5 - 7';
    case 'min7': return '1 - ♭3 - 5 - ♭7';
    case '7': return '1 - 3 - 5 - ♭7';
    case 'ø7': return '1 - ♭3 - ♭5 - ♭7';
    case 'o7': return '1 - ♭3 - ♭5 - 𝄫7';
    default: return '';
  }
};

export const GameDashboard: React.FC<GameDashboardProps> = ({
  currentRoot,
  currentChordType,
  currentInterval,
  showIntervalNames,
  practiceMode,
  targetIntervals = ['III', 'V', 'VII'],
  foundIntervals = [],
  onModeChange,

  onRootChange,
  onChordTypeChange,
  referenceIntervalFilter = 'all',
  onIntervalFilterChange,
  referenceLabelType = 'notes',
  onLabelTypeChange,
  onPlayArpeggio,
  onPlaySingleTone,
  lastPlayedInfo,
  onRandomChord,

  // Live mode props
  isLiveListening = false,
  onToggleLiveListening,
  liveCurrentPitch,
  liveInputLevel = 0,
  livePermissionError,
  liveErrorsCount = 0,

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
  const chordTones = getChordTones(currentRoot, currentChordType);

  // Compute accuracy
  const accuracy = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 100;

  // Visual card styles based on game state
  let feedbackText = '';
  let feedbackSubtext = '';
  let cardBorderClass = 'border-white/10';
  let cardBgClass = 'bg-white/5';
  let glowColor = 'rgba(255, 255, 255, 0.05)';

  if (practiceMode === 'reference') {
    cardBorderClass = 'border-violet-500/30 shadow-[0_0_25px_rgba(139,92,246,0.12)]';
    cardBgClass = 'bg-violet-950/10';
    glowColor = 'rgba(139, 92, 246, 0.08)';
  } else if (practiceMode === 'live') {
    if (gameState === 'SUCCESS') {
      feedbackText = 'All 4 Notes Played! 🎉';
      feedbackSubtext = 'Fantastic chord tones! Advancing to next chord...';
      cardBorderClass = 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]';
      cardBgClass = 'bg-emerald-950/10';
      glowColor = 'rgba(16, 185, 129, 0.1)';
    } else if (gameState === 'TRY_AGAIN') {
      feedbackText = 'Wrong Note Detected... 🔍';
      feedbackSubtext = '1 error recorded. Play the right chord note on your bass!';
      cardBorderClass = 'border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.15)] animate-wobble';
      cardBgClass = 'bg-rose-950/10';
      glowColor = 'rgba(244, 63, 94, 0.1)';
    } else if (gameState === 'FAILED_SHOW_ANSWER') {
      feedbackText = '2 Errors: Revealing Chord Notes 💡';
      feedbackSubtext = 'Positions highlighted on the fingerboard. Moving to next chord...';
      cardBorderClass = 'border-amber-500/40 shadow-[0_0_20px_rgba(234,179,8,0.15)]';
      cardBgClass = 'bg-amber-950/10';
      glowColor = 'rgba(234, 179, 8, 0.1)';
    } else {
      if (foundIntervals.length === 0) {
        feedbackText = isLiveListening ? 'Listening for Root, 3rd, 5th, or 7th...' : 'Microphone Paused';
        feedbackSubtext = isLiveListening ? 'Pluck your double bass to begin.' : 'Click "Start Listening" to activate the microphone.';
      } else {
        feedbackText = `Found ${foundIntervals.length} of 4 chord tones!`;
        feedbackSubtext = 'Pluck remaining notes on your double bass.';
      }
    }
  } else if (practiceMode === 'multi') {
    if (gameState === 'SUCCESS') {
      feedbackText = 'All Chord Tones Found! 🎉';
      feedbackSubtext = 'Fantastic arpeggio! Moving to next chord...';
      cardBorderClass = 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]';
      cardBgClass = 'bg-emerald-950/10';
      glowColor = 'rgba(16, 185, 129, 0.1)';
    } else if (gameState === 'TRY_AGAIN') {
      feedbackText = 'Not In This Chord... 🔍';
      feedbackSubtext = 'Wrong note! You have one more attempt.';
      cardBorderClass = 'border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.15)] animate-wobble';
      cardBgClass = 'bg-rose-950/10';
      glowColor = 'rgba(244, 63, 94, 0.1)';
    } else if (gameState === 'FAILED_SHOW_ANSWER') {
      feedbackText = 'Second Mistake 💡';
      feedbackSubtext = 'All target chord tones are highlighted in Gold on the neck & staff.';
      cardBorderClass = 'border-amber-500/40 shadow-[0_0_20px_rgba(234,179,8,0.15)]';
      cardBgClass = 'bg-amber-950/10';
      glowColor = 'rgba(234, 179, 8, 0.1)';
    } else {
      if (foundIntervals.length === 0) {
        feedbackText = 'Find The Chord Tones!';
        feedbackSubtext = 'Click each target interval on the neck in any order.';
      } else {
        feedbackText = `Found ${foundIntervals.length} of ${targetIntervals.length} tones!`;
        feedbackSubtext = 'Find the remaining chord tone(s) on the neck.';
      }
    }
  } else {
    // Single Interval Mode
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
      feedbackText = 'Identify The Note';
      feedbackSubtext = 'Click the matching position on the fingerboard.';
    }
  }

  const getToneBadgeColor = (interval: string) => {
    switch (interval) {
      case 'I':
        return 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200 hover:bg-indigo-500/30';
      case 'III':
        return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 hover:bg-emerald-500/30';
      case 'V':
        return 'bg-sky-500/20 border-sky-500/50 text-sky-200 hover:bg-sky-500/30';
      case 'VII':
        return 'bg-purple-500/20 border-purple-500/50 text-purple-200 hover:bg-purple-500/30';
      default:
        return 'bg-white/5 border-white/10 text-slate-300';
    }
  };

  const getToneDotColor = (interval: string) => {
    switch (interval) {
      case 'I': return 'bg-indigo-500';
      case 'III': return 'bg-emerald-500';
      case 'V': return 'bg-sky-500';
      case 'VII': return 'bg-purple-500';
      default: return 'bg-white';
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      
      {/* Top Bar: Practice Mode Selector Switch */}
      {onModeChange && (
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-full gap-1">
          <button
            type="button"
            onClick={() => onModeChange('single')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
              practiceMode === 'single'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Single
          </button>
          <button
            type="button"
            onClick={() => onModeChange('multi')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
              practiceMode === 'multi'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Multi-Note
          </button>
          <button
            type="button"
            onClick={() => onModeChange('reference')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
              practiceMode === 'reference'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Reference
          </button>
          <button
            type="button"
            onClick={() => onModeChange('live')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              practiceMode === 'live'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Live Play</span>
            <span className="text-[10px]">🎙️</span>
          </button>
        </div>
      )}

      {/* Mode Specific Cards */}
      {practiceMode === 'reference' ? (
        /* REFERENCE MODE: Interactive Chord Inspector */
        <div className="flex flex-col gap-4">
          
          {/* Root Selector */}
          <div className="flex flex-col gap-1.5 bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Select Root</span>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
              {CHORD_ROOTS.map((root) => {
                const isSelected = root === currentRoot;
                return (
                  <button
                    key={`ref-root-${root}`}
                    type="button"
                    onClick={() => onRootChange?.(root)}
                    className={`py-1.5 px-1 rounded-lg text-xs font-bold font-mono transition-all text-center ${
                      isSelected
                        ? 'bg-violet-600 text-white shadow-md border border-violet-400'
                        : 'bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {root}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chord Type Selector */}
          <div className="flex flex-col gap-1.5 bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Select Chord Type</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {(Object.keys(CHORD_DEFINITIONS) as ChordType[]).map((type) => {
                const def = CHORD_DEFINITIONS[type];
                const isSelected = type === currentChordType;
                return (
                  <button
                    key={`ref-type-${type}`}
                    type="button"
                    onClick={() => onChordTypeChange?.(type)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md border border-indigo-400'
                        : 'bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                    }`}
                  >
                    <span>{def.fullName}</span>
                    <span className="text-[10px] opacity-75 font-mono">({def.symbol})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hero Chord Display Card */}
          <div
            className={`relative flex flex-col items-center justify-center p-6 sm:p-7 rounded-3xl border ${cardBorderClass} ${cardBgClass} transition-all duration-300`}
            style={{
              boxShadow: `inset 0 0 30px ${glowColor}, 0 20px 40px rgba(0, 0, 0, 0.4)`,
            }}
          >
            {/* Chord Title & Formula */}
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-5xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                {currentRoot}
              </span>
              <span className="text-3xl sm:text-4xl font-extrabold text-violet-400 font-mono">
                {chordDef.symbol}
              </span>
            </div>

            <div className="text-xs sm:text-sm text-slate-300 font-semibold mb-2">
              {currentRoot} {chordDef.fullName}
            </div>

            <div className="text-[11px] font-mono font-medium text-indigo-300/90 mb-5 bg-indigo-950/40 px-3 py-1 rounded-full border border-indigo-500/20">
              Formula: {getChordFormula(currentChordType)}
            </div>

            {/* Chord Tone Badges */}
            <div className="w-full flex flex-col items-center gap-2 mb-5">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Chord Tones (Click to Listen)</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-lg">
                {chordTones.map((tone) => (
                  <button
                    key={`ref-tone-${tone.interval}`}
                    type="button"
                    onClick={() => onPlaySingleTone?.(tone.spelling)}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all active:scale-95 ${getToneBadgeColor(tone.interval)}`}
                    title={`Play ${tone.fullName}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${getToneDotColor(tone.interval)}`} />
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] opacity-75">{tone.label} ({tone.shortLabel})</span>
                        <span className="text-sm font-extrabold font-mono">{tone.spelling}</span>
                      </div>
                    </div>
                    <span className="text-xs opacity-60">▶</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reference Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 w-full mb-4">
              {onPlayArpeggio && (
                <button
                  type="button"
                  onClick={onPlayArpeggio}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-violet-600/20 transition-all active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  <span>Play Arpeggio</span>
                </button>
              )}

              {onRandomChord && (
                <button
                  type="button"
                  onClick={onRandomChord}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all active:scale-95"
                >
                  <span>🎲 Random</span>
                </button>
              )}
            </div>

            {/* Neck Display Controls */}
            <div className="w-full flex flex-col gap-2.5 pt-4 border-t border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-400 font-semibold text-[11px]">Neck Node Labels:</span>
                <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/10">
                  <button
                    type="button"
                    onClick={() => onLabelTypeChange?.('notes')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      referenceLabelType === 'notes' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Note Names (C, Eb...)
                  </button>
                  <button
                    type="button"
                    onClick={() => onLabelTypeChange?.('intervals')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      referenceLabelType === 'intervals' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Intervals (R, ♭3...)
                  </button>
                </div>
              </div>

              {/* Interval Filters */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-400 font-semibold text-[11px]">Filter Neck Tones:</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    { key: 'all', label: 'All Tones' },
                    { key: 'root', label: 'Root Only' },
                    { key: 'guide', label: '3rd & 7th' },
                    { key: 'triad', label: 'Triad (1-3-5)' },
                  ].map((f) => (
                    <button
                      key={`filter-${f.key}`}
                      type="button"
                      onClick={() => onIntervalFilterChange?.(f.key as any)}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        referenceIntervalFilter === f.key
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Note Click Status */}
            <div className="w-full text-center mt-3 pt-3 border-t border-white/5">
              <span className="text-xs text-indigo-300 font-mono">
                {lastPlayedInfo || '💡 Click any note on the neck to hear its pitch and locate chord shapes.'}
              </span>
            </div>

          </div>
        </div>
      ) : practiceMode === 'live' ? (
        /* LIVE PLAY MODE: Real-time microphone listening for bass chord tones */
        <>
          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-2 w-full">
            {/* Score Card */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Score</span>
              <span className="text-xl font-bold font-mono text-violet-300">{score}</span>
            </div>

            {/* Streak Card */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Streak</span>
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold font-mono text-emerald-400">{streak}</span>
                {streak >= 3 && <span className="text-xs animate-bounce">🔥</span>}
              </div>
            </div>

            {/* Solved Card */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Solved</span>
              <span className="text-xl font-bold font-mono text-slate-200">
                {correctAnswers}/{totalAttempts}
              </span>
            </div>

            {/* Errors / Attempts Card */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Errors</span>
              <span className={`text-xl font-bold font-mono ${liveErrorsCount >= 2 ? 'text-rose-400' : liveErrorsCount === 1 ? 'text-yellow-400' : 'text-slate-300'}`}>
                {liveErrorsCount} / 2
              </span>
            </div>
          </div>

          {/* Main Live Play Card */}
          <div
            className={`relative overflow-hidden w-full flex flex-col items-center p-5 sm:p-6 rounded-3xl border ${cardBorderClass} ${cardBgClass} backdrop-blur-xl transition-all duration-300 shadow-2xl`}
            style={{
              boxShadow: `0 20px 40px -15px ${glowColor}`,
            }}
          >
            {/* Top Status Banner */}
            <div className="w-full flex items-center justify-between mb-4 gap-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider">
                <span className={`w-2.5 h-2.5 rounded-full ${isLiveListening ? 'bg-rose-500 animate-pulse shadow-rose-glow' : 'bg-slate-500'} inline-block shrink-0`} />
                <span>{isLiveListening ? 'Mic Active' : 'Mic Paused'}</span>
              </div>
              <div className="text-xs font-mono text-slate-400 font-medium">
                Attempts: <span className={liveErrorsCount === 1 ? 'text-yellow-400 font-bold' : liveErrorsCount >= 2 ? 'text-rose-400 font-bold' : 'text-slate-200 font-bold'}>{Math.max(0, 2 - liveErrorsCount)} left</span>
              </div>
            </div>

            {/* Hero Chord Display */}
            <div className="flex flex-col items-center text-center mb-4">
              <div className="flex items-baseline gap-1.5 sm:gap-2 mb-1">
                <span className="text-6xl sm:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  {currentRoot}
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold text-violet-400 font-mono">
                  {chordDef.symbol}
                </span>
              </div>
              <div className="text-xs sm:text-sm text-slate-300 font-semibold mb-1.5">
                {currentRoot} {chordDef.fullName}
              </div>
              <div className="text-[11px] font-mono font-medium text-indigo-300/90 bg-indigo-950/40 px-3 py-0.5 rounded-full border border-indigo-500/20">
                Formula: {getChordFormula(currentChordType)}
              </div>
            </div>

            {/* Target Chord Tones */}
            <div className="w-full flex flex-col items-center gap-1.5 mb-4">
              <span className="text-[10px] uppercase tracking-widest text-indigo-300 font-bold">
                Play These 4 Notes ({foundIntervals.length} of 4 Found)
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2 w-full max-w-lg">
                {['I', 'III', 'V', 'VII'].map((interval) => {
                  const isFound = foundIntervals.includes(interval);
                  const spelledNote = getNoteSpelling(currentRoot, currentChordType, interval);
                  const descName = getIntervalName(interval, currentChordType);
                  const intervalLabel = interval === 'I' ? '1st' : interval === 'III' ? '3rd' : interval === 'V' ? '5th' : '7th';

                  return (
                    <div
                      key={`live-target-${interval}`}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                        isFound
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                          : gameState === 'FAILED_SHOW_ANSWER'
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-[0_0_12px_rgba(234,179,8,0.25)]'
                          : 'bg-white/5 border-white/10 text-slate-300'
                      }`}
                    >
                      <span className="text-sm font-black font-mono">
                        {spelledNote}
                      </span>
                      <span className="text-[10px] opacity-75 font-semibold">
                        {intervalLabel}
                      </span>
                      {showIntervalNames && (
                        <span className="text-[10px] opacity-60 truncate max-w-[70px]">
                          ({descName})
                        </span>
                      )}
                      <span className={`text-xs font-mono font-bold ${isFound ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {isFound ? '✓' : '○'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chromatic Bass Tuner & Audio Level Console */}
            <div className="w-full max-w-full min-w-0 flex flex-col gap-3.5 p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 shadow-2xl backdrop-blur-md mb-4 overflow-hidden">
              
              {/* Header Bar: Mic Controls & Audio Level VU Meter */}
              <div className="w-full flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onToggleLiveListening}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-200 flex items-center gap-2 active:scale-95 ${
                      isLiveListening
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    }`}
                  >
                    <span className="text-sm">{isLiveListening ? '⏹' : '🎙️'}</span>
                    <span>{isLiveListening ? 'Pause Mic' : 'Start Mic'}</span>
                  </button>

                  {isLiveListening ? (
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold tracking-wide">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                      </span>
                      <span>LISTENING</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[10px] font-medium">
                      <span className="w-2 h-2 rounded-full bg-slate-500" />
                      <span>PAUSED</span>
                    </div>
                  )}
                </div>

                {/* Integrated Sound Level (VU Meter) */}
                <div className="w-full sm:w-auto sm:max-w-xs flex-1 min-w-0 flex flex-col gap-1.5 bg-black/50 px-3 py-2 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400 font-semibold tracking-wider">AUDIO LEVEL</span>
                    {isLiveListening ? (
                      <span className={`font-bold ${
                        liveInputLevel < 0.05
                          ? 'text-slate-500'
                          : liveInputLevel < 0.20
                          ? 'text-sky-400'
                          : liveInputLevel < 0.70
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}>
                        {liveInputLevel < 0.05 ? 'SILENT' : liveInputLevel < 0.20 ? 'DETECTING' : liveInputLevel < 0.70 ? 'GOOD SIGNAL 🎵' : 'PEAK 🔊'}
                      </span>
                    ) : (
                      <span className="text-slate-500">OFF</span>
                    )}
                  </div>

                  {/* LED Meter Bar */}
                  <div className="flex gap-1 h-3.5 w-full bg-black/80 p-0.5 rounded-lg border border-white/10 shadow-inner">
                    {Array.from({ length: 24 }).map((_, segIdx) => {
                      const activeCount = Math.round(liveInputLevel * 24);
                      const isActive = isLiveListening && segIdx < activeCount;
                      
                      let activeColor = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]';
                      let inactiveColor = 'bg-emerald-950/40 border border-emerald-500/15';
                      if (segIdx >= 14 && segIdx < 19) {
                        activeColor = 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]';
                        inactiveColor = 'bg-amber-950/40 border border-amber-500/15';
                      } else if (segIdx >= 19) {
                        activeColor = 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]';
                        inactiveColor = 'bg-rose-950/40 border border-rose-500/15';
                      }

                      return (
                        <span
                          key={`vu-seg-${segIdx}`}
                          className={`flex-1 h-full rounded-[1.5px] transition-all duration-75 ${
                            isActive ? activeColor : inactiveColor
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Tuner Screen & Gauge */}
              {livePermissionError ? (
                <div className="py-4 text-center">
                  <span className="text-xs text-rose-400 font-bold">
                    ⚠️ {livePermissionError}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Please allow microphone access in your browser to use Live Play mode.
                  </p>
                </div>
              ) : !isLiveListening ? (
                <div className="py-5 text-center flex flex-col items-center gap-1.5">
                  <span className="text-2xl opacity-40">🎙️</span>
                  <span className="text-xs text-slate-300 font-semibold">
                    Microphone is currently paused
                  </span>
                  <span className="text-[11px] text-slate-400 max-w-sm">
                    Click <strong className="text-emerald-400">Start Listening</strong> to detect notes from your double bass in real time.
                  </span>
                </div>
              ) : (
                <div className="w-full min-w-0 max-w-full flex flex-col items-center pt-1">
                  {/* Note & Pitch Tuning Status */}
                  <div className="flex items-center justify-between w-full px-2 mb-3">
                    {/* Left: Tuning Deviation in Cents */}
                    <div className="w-24 text-left">
                      {liveCurrentPitch ? (
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deviation</span>
                          <span className={`text-base font-black font-mono ${
                            Math.abs(liveCurrentPitch.cents) <= 5
                              ? 'text-emerald-400'
                              : liveCurrentPitch.cents < 0
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}>
                            {liveCurrentPitch.cents > 0 ? `+${liveCurrentPitch.cents}` : liveCurrentPitch.cents}¢
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-mono">--</span>
                      )}
                    </div>

                    {/* Center: Big Note Display */}
                    <div className="flex flex-col items-center">
                      {liveCurrentPitch ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-6xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                            {liveCurrentPitch.noteName}
                          </span>
                          <span className="text-2xl font-black font-mono text-slate-400">
                            {liveCurrentPitch.octave}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-6xl font-black font-mono text-slate-700">
                            --
                          </span>
                        </div>
                      )}

                      {/* In-Tune Status Badge */}
                      <div className="mt-1">
                        {liveCurrentPitch ? (
                          Math.abs(liveCurrentPitch.cents) <= 5 ? (
                            <span className="px-3 py-1 rounded-full text-xs font-black font-mono bg-emerald-500/25 border border-emerald-500/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                              ✓ IN TUNE
                            </span>
                          ) : liveCurrentPitch.cents < -5 ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-amber-500/25 border border-amber-500/60 text-amber-300">
                              ◀ FLAT • TUNE UP ↗
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-rose-500/25 border border-rose-500/60 text-rose-300">
                              SHARP • TUNE DOWN ↘ ▶
                            </span>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-500 font-medium animate-pulse">
                            Listening for bass notes...
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Frequency readout */}
                    <div className="w-24 text-right">
                      {liveCurrentPitch ? (
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pitch</span>
                          <span className="text-sm font-bold font-mono text-slate-200">
                            {liveCurrentPitch.freq} <span className="text-[10px] font-normal text-slate-400">Hz</span>
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-mono">--</span>
                      )}
                    </div>
                  </div>

                  {/* Tuner Cents Needle Gauge */}
                  <div className="w-full min-w-0 max-w-full flex flex-col gap-1.5 px-1">
                    {/* Needle Track */}
                    <div className="relative w-full h-8 bg-black/80 rounded-xl border border-white/15 px-3 overflow-hidden flex items-center shadow-inner">
                      {/* Center In-Tune Target Zone */}
                      <div className="absolute left-1/2 -translate-x-1/2 w-10 h-full bg-emerald-500/15 border-x border-emerald-500/40" />

                      {/* Scale tick marks */}
                      <div className="w-full flex justify-between items-center text-[10px] font-mono text-slate-500 px-1 z-0 pointer-events-none">
                        <span className="font-semibold">-50</span>
                        <span>-25</span>
                        <span className="text-emerald-400 font-black text-xs">▲ 0</span>
                        <span>+25</span>
                        <span className="font-semibold">+50</span>
                      </div>

                      {/* Moving Needle */}
                      {liveCurrentPitch ? (
                        <div
                          className="absolute top-0 bottom-0 w-2 transition-all duration-100 ease-out z-10 flex flex-col items-center justify-center -translate-x-1/2"
                          style={{
                            left: `${50 + (Math.max(-50, Math.min(50, liveCurrentPitch.cents)) / 50) * 44}%`,
                          }}
                        >
                          <span
                            className={`w-1.5 h-full rounded-full ${
                              Math.abs(liveCurrentPitch.cents) <= 5
                                ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,1)]'
                                : liveCurrentPitch.cents < 0
                                ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,1)]'
                                : 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,1)]'
                            }`}
                          />
                        </div>
                      ) : (
                        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-slate-700/50" />
                      )}
                    </div>

                    {/* Scale Labels */}
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider px-1">
                      <span className="text-amber-400/90">◀ Flat (♭)</span>
                      <span className="text-emerald-400 font-mono">In Tune (±5¢)</span>
                      <span className="text-rose-400/90">Sharp (♯) ▶</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Visual feedback banner */}
            <div className="w-full flex flex-col items-center justify-center min-h-[46px] border-t border-white/5 pt-3 text-center">
              <span className={`text-sm font-bold tracking-wide transition-all ${
                gameState === 'SUCCESS' ? 'text-emerald-400' :
                gameState === 'TRY_AGAIN' ? 'text-rose-400' :
                gameState === 'FAILED_SHOW_ANSWER' ? 'text-amber-400' : 'text-slate-300'
              }`}>
                {feedbackText}
              </span>
              <span className="text-xs text-slate-400 mt-0.5 max-w-[280px]">
                {feedbackSubtext}
              </span>
            </div>

            {/* Next Question / Skip Button */}
            <div className="flex items-center gap-3 mt-4">
              {(gameState === 'SUCCESS' || gameState === 'FAILED_SHOW_ANSWER') ? (
                <button
                  onClick={onNextQuestion}
                  className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-bold text-xs uppercase tracking-wider shadow-[0_4px_12px_rgba(124,58,237,0.3)] transition-all duration-150 hover:scale-[1.03] active:scale-[0.98]"
                >
                  Next Chord ➔
                </button>
              ) : (
                <button
                  onClick={onNextQuestion}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-xs font-semibold uppercase tracking-wider transition-all"
                  title="Skip to next chord"
                >
                  Skip Chord ❯
                </button>
              )}
            </div>

          </div>
        </>
      ) : (
        /* QUIZ MODES: Single Interval & Multi-Note */
        <>
          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-2 w-full">
            {/* Score Card */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Score</span>
              <span className="text-xl font-bold font-mono text-violet-300">{score}</span>
            </div>

            {/* Streak Card */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Streak</span>
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold font-mono text-emerald-400">{streak}</span>
                {streak >= 3 && <span className="text-xs animate-bounce">🔥</span>}
              </div>
            </div>

            {/* Attempts Card */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Solved</span>
              <span className="text-xl font-bold font-mono text-slate-200">
                {correctAnswers}/{totalAttempts}
              </span>
            </div>

            {/* Accuracy Card */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Accuracy</span>
              <span className="text-xl font-bold font-mono text-slate-200">{accuracy}%</span>
            </div>
          </div>

          {/* Main Chord Quiz Card */}
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
            {practiceMode === 'multi' ? (
              <div className="text-center flex flex-col items-center gap-2 mb-4 w-full">
                <div className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">
                  Find Chord Tones ({foundIntervals.length} of {targetIntervals.length} Found)
                </div>
                
                {/* Target tones chips */}
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mt-1">
                  {targetIntervals.map((interval) => {
                    const isFound = foundIntervals.includes(interval);
                    const spelledNote = getNoteSpelling(currentRoot, currentChordType, interval);
                    const descName = getIntervalName(interval, currentChordType);
                    const isRevealed = isFound || gameState === 'FAILED_SHOW_ANSWER';

                    return (
                      <div
                        key={`dash-interval-${interval}`}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                          isFound
                            ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                            : gameState === 'FAILED_SHOW_ANSWER'
                            ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-[0_0_12px_rgba(234,179,8,0.25)]'
                            : 'bg-white/5 border-white/10 text-slate-300'
                        }`}
                      >
                        <span className="font-bold text-sm">
                          {isFound ? '✓' : '○'} {interval}
                        </span>
                        <span className="font-mono text-xs font-semibold">
                          · {isRevealed ? spelledNote : '?'}
                        </span>
                        {showIntervalNames && (
                          <span className="text-[10px] opacity-75">
                            ({descName})
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center flex flex-col items-center gap-2 mb-4">
                <div className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">Find Interval</div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
                    {currentInterval}
                  </span>
                  {showIntervalNames && (
                    <span className="text-lg text-slate-300 font-medium">
                      ({intervalName})
                    </span>
                  )}
                </div>
              </div>
            )}

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
                {practiceMode === 'multi' ? 'Next Chord' : 'Next Interval'}
              </button>
            )}
          </div>
        </>
      )}

    </div>
  );
};
