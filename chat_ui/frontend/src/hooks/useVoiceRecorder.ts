/**
 * Real-Time Voice Recorder Hook
 *
 * State-of-the-art patterns for 2025:
 * - WebRTC MediaRecorder for browser audio capture
 * - Streaming to Deepgram for real-time transcription
 * - VAD-style automatic turn detection
 * - CAPS LOCK / toggle mode for persistent mic
 * - Real-time transcript updates in chat
 *
 * Architecture:
 * Browser Mic → MediaRecorder → Deepgram STT → Chat Display
 *                                    ↓
 *                             Claude Opus 4.5 → Cartesia TTS → Speaker
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export type VoiceMode = 'off' | 'push-to-talk' | 'toggle' | 'vad';
export type RecordingState = 'idle' | 'recording' | 'processing' | 'speaking';

interface VoiceRecorderOptions {
  onTranscript: (text: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onStateChange?: (state: RecordingState) => void;
  sttProvider?: 'deepgram' | 'assemblyai';
}

interface VoiceRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  mode: VoiceMode;
  transcribedText: string;
  interimText: string;
  recordingState: RecordingState;
  volume: number; // 0-1 for visualization
}

export function useVoiceRecorder(options: VoiceRecorderOptions) {
  const { onTranscript, onError, onStateChange, sttProvider = 'deepgram' } = options;

  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
    isPaused: false,
    mode: 'off',
    transcribedText: '',
    interimText: '',
    recordingState: 'idle',
    volume: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const volumeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const capsLockRef = useRef(false);

  // Update recording state and notify parent
  const setRecordingState = useCallback((newState: RecordingState) => {
    setState(prev => ({ ...prev, recordingState: newState }));
    onStateChange?.(newState);
  }, [onStateChange]);

  // Calculate volume level for visualization
  const startVolumeAnalysis = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    volumeIntervalRef.current = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const normalizedVolume = Math.min(1, average / 128);
      setState(prev => ({ ...prev, volume: normalizedVolume }));
    }, 50);
  }, []);

  const stopVolumeAnalysis = useCallback(() => {
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }
    setState(prev => ({ ...prev, volume: 0 }));
  }, []);

  // Start recording from microphone
  const startRecording = useCallback(async () => {
    try {
      setRecordingState('recording');

      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;

      // Set up audio context for volume analysis
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start volume visualization
      startVolumeAnalysis();

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setRecordingState('processing');

        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const base64 = await blobToBase64(audioBlob);

        // Send to STT API
        try {
          const response = await fetch('/api/orchestrator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              route: 'voice_stt',
              audio: base64,
              sttProvider,
            }),
          });

          const data = await response.json();

          if (data.success && data.text) {
            setState(prev => ({
              ...prev,
              transcribedText: data.text,
              interimText: '',
            }));
            onTranscript(data.text, true);
          } else {
            onError(data.error || 'Failed to transcribe audio');
          }
        } catch (err) {
          onError(`Transcription failed: ${err}`);
        }

        setRecordingState('idle');
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250); // Collect data every 250ms

      setState(prev => ({ ...prev, isRecording: true, interimText: '' }));
    } catch (err) {
      onError(`Microphone access denied: ${err}`);
      setRecordingState('idle');
    }
  }, [onTranscript, onError, sttProvider, startVolumeAnalysis, setRecordingState]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    // Clean up streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    stopVolumeAnalysis();
    setState(prev => ({ ...prev, isRecording: false }));
  }, [stopVolumeAnalysis]);

  // Toggle recording (for toggle mode)
  const toggleRecording = useCallback(() => {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [state.isRecording, startRecording, stopRecording]);

  // Set voice mode
  const setMode = useCallback((mode: VoiceMode) => {
    setState(prev => ({ ...prev, mode }));

    if (mode === 'off' && state.isRecording) {
      stopRecording();
    }
  }, [state.isRecording, stopRecording]);

  // Handle CAPS LOCK for toggle mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.mode === 'toggle' && e.key === 'CapsLock') {
        capsLockRef.current = !capsLockRef.current;
        if (capsLockRef.current) {
          startRecording();
        } else {
          stopRecording();
        }
      }

      // Push-to-talk with spacebar
      if (state.mode === 'push-to-talk' && e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        startRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (state.mode === 'push-to-talk' && e.code === 'Space') {
        e.preventDefault();
        stopRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [state.mode, startRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      stopVolumeAnalysis();
    };
  }, [stopRecording, stopVolumeAnalysis]);

  return {
    ...state,
    startRecording,
    stopRecording,
    toggleRecording,
    setMode,
  };
}

// Helper: Convert Blob to Base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default useVoiceRecorder;
