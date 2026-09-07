import { useState, useRef, useCallback, useEffect } from 'react';
import { detectPitchFromBuffer } from '../utils/pitchDetection';
import type { DetectedPitch } from '../utils/pitchDetection';

export interface UsePitchDetectionOptions {
  onNoteDetected?: (note: DetectedPitch) => void;
  preferredSpelling?: 'sharp' | 'flat' | string[];
}

export interface PitchDetectionControls {
  isListening: boolean;
  inputLevel: number; // 0 to 1 for VU meter
  currentPitch: DetectedPitch | null;
  hasPermission: boolean | null;
  permissionError: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  toggleListening: () => void;
}

export const usePitchDetection = (options?: UsePitchDetectionOptions): PitchDetectionControls => {
  const [isListening, setIsListening] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);
  const [currentPitch, setCurrentPitch] = useState<DetectedPitch | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Stability detection refs
  const lastCandidateMidiRef = useRef<number | null>(null);
  const candidateFramesRef = useRef<number>(0);
  const lastEmittedMidiRef = useRef<number | null>(null);
  const lastEmitTimeRef = useRef<number>(0);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const stopListening = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }

    analyserRef.current = null;
    setIsListening(false);
    setInputLevel(0);
    setCurrentPitch(null);
    lastCandidateMidiRef.current = null;
    candidateFramesRef.current = 0;
    lastEmittedMidiRef.current = null;
  }, []);

  const startListening = useCallback(async () => {
    try {
      setPermissionError(null);

      // Stop any existing stream
      stopListening();

      // Request microphone with processing disabled for clean raw bass timbre
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      streamRef.current = stream;
      setHasPermission(true);

      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);

      // Low-pass filter at 850Hz to filter high noise / room hiss while retaining bass fundamentals
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(850, ctx.currentTime);

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096; // 4096 samples provides ~92ms at 44.1kHz, ideal for low E1 (41.2Hz)
      analyserRef.current = analyser;

      source.connect(lowpass);
      lowpass.connect(analyser);

      const buffer = new Float32Array(analyser.fftSize);
      setIsListening(true);

      const processAudio = () => {
        if (!analyserRef.current || !audioCtxRef.current) return;

        analyserRef.current.getFloatTimeDomainData(buffer);
        const sampleRate = audioCtxRef.current.sampleRate;
        const preferredSpelling = optionsRef.current?.preferredSpelling;

        const detected = detectPitchFromBuffer(buffer, sampleRate, preferredSpelling);

        if (detected) {
          // Update level (scale RMS to 0-1)
          const level = Math.min(1, detected.rms * 6);
          setInputLevel(level);
          setCurrentPitch(detected);

          const now = performance.now();
          const targetMidi = detected.midi;

          // Check pitch stability across frames
          if (lastCandidateMidiRef.current === targetMidi) {
            candidateFramesRef.current += 1;
          } else {
            lastCandidateMidiRef.current = targetMidi;
            candidateFramesRef.current = 1;
          }

          // Trigger note event if stable for ~4 consecutive frames (~70-100ms)
          // and either it's a new note, or 400ms has elapsed since last note
          if (candidateFramesRef.current >= 4) {
            const isDifferentNote = lastEmittedMidiRef.current !== targetMidi;
            const cooldownPassed = now - lastEmitTimeRef.current > 400;

            if (isDifferentNote || cooldownPassed) {
              lastEmittedMidiRef.current = targetMidi;
              lastEmitTimeRef.current = now;
              optionsRef.current?.onNoteDetected?.(detected);
            }
          }
        } else {
          // Silence or ambient room noise
          setInputLevel(prev => Math.max(0, prev * 0.85 - 0.02));
          setCurrentPitch(null);
          lastCandidateMidiRef.current = null;
          candidateFramesRef.current = 0;
          // After 250ms of silence, allow re-triggering the same pitch
          if (performance.now() - lastEmitTimeRef.current > 250) {
            lastEmittedMidiRef.current = null;
          }
        }

        animFrameIdRef.current = requestAnimationFrame(processAudio);
      };

      animFrameIdRef.current = requestAnimationFrame(processAudio);
    } catch (err: unknown) {
      console.error('Failed to access microphone for pitch detection:', err);
      const errMsg = err instanceof Error ? err.message : 'Microphone access denied';
      setPermissionError(errMsg);
      setHasPermission(false);
      stopListening();
    }
  }, [stopListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    inputLevel,
    currentPitch,
    hasPermission,
    permissionError,
    startListening,
    stopListening,
    toggleListening,
  };
};
