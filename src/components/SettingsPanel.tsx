import React from 'react';
import { CHORD_DEFINITIONS } from '../utils/musicTheory';
import type { ChordType } from '../utils/musicTheory';

interface SettingsPanelProps {
  showNoteNames: boolean;
  setShowNoteNames: (val: boolean) => void;
  showRootNotes: boolean;
  setShowRootNotes: (val: boolean) => void;
  showTapes: boolean;
  setShowTapes: (val: boolean) => void;
  showPositionLines: boolean;
  setShowPositionLines: (val: boolean) => void;
  
  volume: number;
  setVolume: (val: number) => void;
  isMuted: boolean;
  setIsMuted: (val: boolean) => void;

  selectedChordTypes: ChordType[];
  setSelectedChordTypes: (types: ChordType[]) => void;
  selectedIntervals: string[];
  setSelectedIntervals: (intervals: string[]) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  showNoteNames,
  setShowNoteNames,
  showRootNotes,
  setShowRootNotes,
  showTapes,
  setShowTapes,
  showPositionLines,
  setShowPositionLines,
  
  volume,
  setVolume,
  isMuted,
  setIsMuted,

  selectedChordTypes,
  setSelectedChordTypes,
  selectedIntervals,
  setSelectedIntervals,
}) => {
  
  const allIntervals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

  const toggleChordType = (type: ChordType) => {
    if (selectedChordTypes.includes(type)) {
      // Keep at least one checked
      if (selectedChordTypes.length > 1) {
        setSelectedChordTypes(selectedChordTypes.filter(t => t !== type));
      }
    } else {
      setSelectedChordTypes([...selectedChordTypes, type]);
    }
  };

  const toggleInterval = (interval: string) => {
    if (selectedIntervals.includes(interval)) {
      // Keep at least one checked
      if (selectedIntervals.length > 1) {
        setSelectedIntervals(selectedIntervals.filter(i => i !== interval));
      }
    } else {
      setSelectedIntervals([...selectedIntervals, interval]);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-violet-500/20">
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-violet-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Practice Settings</h3>
      </div>

      {/* Volume control */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Volume & Sound</label>
        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-rose-400">
                <path d="M9.547 3.062A.75.75 0 0 1 10 3.75v12.5a.75.75 0 0 1-1.264.546L5.203 13H3.25A1.75 1.75 0 0 1 1.5 11.25v-2.5A1.75 1.75 0 0 1 3.25 7h1.953l3.533-3.296a.75.75 0 0 1 .811-.142ZM13.28 7.22a.75.75 0 1 0-1.06 1.06L13.94 10l-1.72 1.72a.75.75 0 0 0 1.06 1.06L15 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L16.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L15 8.94l-1.72-1.72Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M10 3.75a.75.75 0 0 0-1.264-.546L5.203 6.5H3.25A1.75 1.75 0 0 0 1.5 8.25v3.5A1.75 1.75 0 0 0 3.25 13.5h1.953l3.533 3.296A.75.75 0 0 0 10 16.25V3.75ZM14 7a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 14 7ZM16.25 5.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0v-7.5a.75.75 0 0 1 .75-.75Z" />
              </svg>
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 accent-violet-500 bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs font-mono text-slate-400 w-8 text-right">{Math.round(volume * 100)}%</span>
        </div>
      </div>

      {/* Visual Toggles */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fingerboard Guides</label>
        
        <div className="flex flex-col gap-2.5">
          <label className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-200">Show Note Names</span>
              <span className="text-xs text-slate-400">Display pitches directly on the neck (Easy mode)</span>
            </div>
            <input
              type="checkbox"
              checked={showNoteNames}
              onChange={(e) => setShowNoteNames(e.target.checked)}
              className="w-4 h-4 rounded text-violet-600 bg-white/10 border-white/20 focus:ring-violet-500 focus:ring-2 focus:ring-offset-0 accent-violet-500"
            />
          </label>

          <label className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-200">Show Root Notes</span>
              <span className="text-xs text-slate-400">Highlight all root note positions on the fingerboard</span>
            </div>
            <input
              type="checkbox"
              checked={showRootNotes}
              onChange={(e) => setShowRootNotes(e.target.checked)}
              className="w-4 h-4 rounded text-violet-600 bg-white/10 border-white/20 focus:ring-violet-500 focus:ring-2 focus:ring-offset-0 accent-violet-500"
            />
          </label>

          <label className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-200">Show Student Tapes</span>
              <span className="text-xs text-slate-400">Position markings at 3rd, 5th, 7th, 9th, and 12th positions</span>
            </div>
            <input
              type="checkbox"
              checked={showTapes}
              onChange={(e) => setShowTapes(e.target.checked)}
              className="w-4 h-4 rounded text-violet-600 bg-white/10 border-white/20 focus:ring-violet-500 focus:ring-2 focus:ring-offset-0 accent-violet-500"
            />
          </label>

          <label className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-200">Show Subtle Position Lines</span>
              <span className="text-xs text-slate-400">Thin dashed lines indicating where each position resides</span>
            </div>
            <input
              type="checkbox"
              checked={showPositionLines}
              onChange={(e) => setShowPositionLines(e.target.checked)}
              className="w-4 h-4 rounded text-violet-600 bg-white/10 border-white/20 focus:ring-violet-500 focus:ring-2 focus:ring-offset-0 accent-violet-500"
            />
          </label>
        </div>
      </div>

      {/* Chord Selection */}
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chords to Practice</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.keys(CHORD_DEFINITIONS) as ChordType[]).map((type) => {
            const def = CHORD_DEFINITIONS[type];
            const isChecked = selectedChordTypes.includes(type);
            return (
              <button
                key={`opt-chord-${type}`}
                onClick={() => toggleChordType(type)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all ${
                  isChecked
                    ? 'bg-violet-600/20 border-violet-500/50 text-violet-200'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold font-mono">{def.fullName}</span>
                  <span className="text-[10px] text-slate-400">Symbol: {def.symbol}</span>
                </div>
                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  isChecked ? 'border-violet-400 bg-violet-500' : 'border-slate-600 bg-transparent'
                }`}>
                  {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interval Selection */}
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Intervals to Find</label>
        <div className="grid grid-cols-4 gap-2">
          {allIntervals.map((interval) => {
            const isChecked = selectedIntervals.includes(interval);
            return (
              <button
                key={`opt-int-${interval}`}
                onClick={() => toggleInterval(interval)}
                className={`py-2 rounded-xl border font-bold text-sm text-center transition-all ${
                  isChecked
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300'
                }`}
              >
                {interval}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
