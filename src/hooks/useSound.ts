import { useRef, useCallback, useEffect } from 'react';

export interface SoundControls {
  playNote: (midiPitch: number) => void;
  playSuccess: () => void;
  playFailure: () => void;
  setVolume: (vol: number) => void;
  setMuted: (muted: boolean) => void;
}

export const useSound = (): SoundControls => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const volumeNodeRef = useRef<GainNode | null>(null);
  const isMutedRef = useRef<boolean>(false);
  const currentVolumeRef = useRef<number>(0.5);

  // Initialize audio context lazily
  const initAudio = () => {
    if (!audioCtxRef.current) {
      // Support standard and older browsers
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
      
      const gainNode = audioCtxRef.current.createGain();
      gainNode.gain.setValueAtTime(currentVolumeRef.current, audioCtxRef.current.currentTime);
      gainNode.connect(audioCtxRef.current.destination);
      volumeNodeRef.current = gainNode;
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  // Convert MIDI pitch to frequency
  const midiToFreq = (midi: number): number => {
    return 440 * Math.pow(2, (midi - 69) / 12);
  };

  // Play a standard double bass note (plucked/pizzicato sound)
  const playNote = useCallback((midiPitch: number) => {
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      const mainVolume = volumeNodeRef.current;
      
      if (!ctx || !mainVolume || isMutedRef.current) return;

      // Double bass sounds one octave lower than written
      const soundingMidi = midiPitch - 12;
      const freq = midiToFreq(soundingMidi);

      const now = ctx.currentTime;

      // 1. Primary oscillator (sawtooth for string harmonics)
      const oscSaw = ctx.createOscillator();
      oscSaw.type = 'sawtooth';
      oscSaw.frequency.setValueAtTime(freq, now);

      // Add a tiny bit of vibrato (frequency modulation)
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(5.5, now); // 5.5 Hz vibrato
      lfoGain.gain.setValueAtTime(freq * 0.005, now); // very subtle frequency swing
      lfo.connect(lfoGain);
      lfoGain.connect(oscSaw.frequency);

      // 2. Secondary oscillator (triangle for fundamental weight)
      const oscTri = ctx.createOscillator();
      oscTri.type = 'triangle';
      oscTri.frequency.setValueAtTime(freq, now);

      // 3. Lowpass filter to warm up the sawtooth
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      // Low pitches need a lower cutoff to filter out buzzing
      const cutoff = Math.max(freq * 3, 120);
      filter.frequency.setValueAtTime(cutoff, now);
      // Sweeping the filter down slightly mimics a real pluck
      filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.5, 80), now + 0.6);

      // 4. Amplitude Envelope
      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0, now);
      // Quick attack for a pluck (0.015s)
      noteGain.gain.linearRampToValueAtTime(0.7, now + 0.015);
      // Quick decay to sustain level
      noteGain.gain.exponentialRampToValueAtTime(0.25, now + 0.3);
      // Sustain and release
      noteGain.gain.setValueAtTime(0.25, now + 0.5);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      // Connect nodes
      oscSaw.connect(filter);
      oscTri.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(mainVolume);

      // Start LFO and Oscillators
      lfo.start(now);
      oscSaw.start(now);
      oscTri.start(now);

      // Stop everything
      lfo.stop(now + 2.0);
      oscSaw.stop(now + 2.0);
      oscTri.stop(now + 2.0);
    } catch (e) {
      console.warn("Failed to play audio note:", e);
    }
  }, []);

  // Play success chime
  const playSuccess = useCallback(() => {
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      const mainVolume = volumeNodeRef.current;
      
      if (!ctx || !mainVolume || isMutedRef.current) return;

      const now = ctx.currentTime;
      // Play a lovely major arpeggio in sine waves (C major arpeggio: C4, E4, G4, C5)
      // Sounding pitches (written pitches: C5, E5, G5, C6)
      const pitches = [72, 76, 79, 84]; 
      
      pitches.forEach((pitch, index) => {
        const time = now + index * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(midiToFreq(pitch), time);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.3, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.4);

        osc.connect(gain);
        gain.connect(mainVolume);

        osc.start(time);
        osc.stop(time + 0.5);
      });
    } catch (e) {
      console.warn("Failed to play success sound:", e);
    }
  }, []);

  // Play failure sound
  const playFailure = useCallback(() => {
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      const mainVolume = volumeNodeRef.current;
      
      if (!ctx || !mainVolume || isMutedRef.current) return;

      const now = ctx.currentTime;
      // Low, flat buzz dropping in frequency
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(65, now + 0.35);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(mainVolume);

      osc.start(now);
      osc.stop(now + 0.55);
    } catch (e) {
      console.warn("Failed to play failure sound:", e);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    const cleanVol = Math.max(0, Math.min(1, vol));
    currentVolumeRef.current = cleanVol;
    if (volumeNodeRef.current && audioCtxRef.current) {
      volumeNodeRef.current.gain.setValueAtTime(cleanVol, audioCtxRef.current.currentTime);
    }
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    isMutedRef.current = muted;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(err => console.warn("Error closing AudioContext:", err));
      }
    };
  }, []);

  return {
    playNote,
    playSuccess,
    playFailure,
    setVolume,
    setMuted,
  };
};
