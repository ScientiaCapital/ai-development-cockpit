'use client';

/**
 * Real-Time Voice Input Component
 *
 * Features:
 * - Push-to-Talk (hold spacebar) or Toggle Mode (CAPS LOCK)
 * - Real-time waveform visualization
 * - Transcription displayed in real-time
 * - Integrates with chat interface
 *
 * UI/UX Patterns from 2025 state-of-the-art:
 * - Visual volume indicator
 * - Mode selector (PTT vs Toggle vs VAD)
 * - Status indicators (recording, processing, speaking)
 */

import { useState, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Settings2,
  Keyboard,
  Hand,
  Waves,
  Loader2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceRecorder, VoiceMode, RecordingState } from '@/hooks/useVoiceRecorder';
import styles from './VoiceInput.module.css';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function VoiceInput({
  onTranscript,
  onError,
  disabled = false,
  className,
}: VoiceInputProps) {
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [currentMode, setCurrentMode] = useState<VoiceMode>('off');
  const [muted, setMuted] = useState(false);

  const handleTranscript = useCallback((text: string, isFinal: boolean) => {
    if (isFinal && text.trim()) {
      onTranscript(text);
    }
  }, [onTranscript]);

  const handleError = useCallback((error: string) => {
    console.error('[VoiceInput]', error);
    onError?.(error);
  }, [onError]);

  const {
    isRecording,
    recordingState,
    volume,
    interimText,
    startRecording,
    stopRecording,
    toggleRecording,
    setMode,
  } = useVoiceRecorder({
    onTranscript: handleTranscript,
    onError: handleError,
  });

  const handleModeChange = (mode: VoiceMode) => {
    setCurrentMode(mode);
    setMode(mode);
    setShowModeMenu(false);
  };

  const handleMicClick = () => {
    if (disabled || muted) return;

    if (currentMode === 'off') {
      // First click enables toggle mode
      handleModeChange('toggle');
      startRecording();
    } else if (currentMode === 'toggle') {
      toggleRecording();
    }
  };

  const getStateIcon = () => {
    switch (recordingState) {
      case 'recording':
        return <Mic className={styles.micActive} size={24} />;
      case 'processing':
        return <Loader2 className={styles.spinner} size={24} />;
      case 'speaking':
        return <Volume2 className={styles.speaking} size={24} />;
      default:
        return currentMode === 'off' ? <MicOff size={24} /> : <Mic size={24} />;
    }
  };

  const getStateLabel = () => {
    switch (recordingState) {
      case 'recording':
        return 'Listening...';
      case 'processing':
        return 'Transcribing...';
      case 'speaking':
        return 'Speaking...';
      default:
        if (currentMode === 'push-to-talk') return 'Hold SPACE';
        if (currentMode === 'toggle') return 'CAPS to toggle';
        return 'Click to enable';
    }
  };

  const getModeIcon = (mode: VoiceMode) => {
    switch (mode) {
      case 'push-to-talk':
        return <Hand size={16} />;
      case 'toggle':
        return <Keyboard size={16} />;
      case 'vad':
        return <Waves size={16} />;
      default:
        return <MicOff size={16} />;
    }
  };

  const getModeLabel = (mode: VoiceMode) => {
    switch (mode) {
      case 'push-to-talk':
        return 'Push-to-Talk (Space)';
      case 'toggle':
        return 'Toggle (CAPS Lock)';
      case 'vad':
        return 'Auto (VAD)';
      default:
        return 'Off';
    }
  };

  return (
    <div className={cn(styles.container, className)}>
      {/* Interim Transcript Display */}
      {interimText && (
        <div className={styles.interimTranscript}>
          <span className={styles.interimText}>{interimText}</span>
          <span className={styles.interimCursor} />
        </div>
      )}

      <div className={styles.controls}>
        {/* Mute Toggle */}
        <button
          className={cn(styles.controlBtn, muted && styles.muted)}
          onClick={() => {
            setMuted(!muted);
            if (!muted && isRecording) {
              stopRecording();
            }
          }}
          title={muted ? 'Unmute' : 'Mute'}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        {/* Main Mic Button */}
        <div className={styles.micContainer}>
          {/* Volume Ring */}
          {isRecording && (
            <div
              className={styles.volumeRing}
              style={{
                transform: `scale(${1 + volume * 0.5})`,
                opacity: 0.3 + volume * 0.7,
              }}
            />
          )}

          {/* Waveform Animation */}
          {isRecording && (
            <div className={styles.waveform}>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={styles.waveBar}
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    height: `${20 + Math.random() * volume * 30}px`,
                  }}
                />
              ))}
            </div>
          )}

          <button
            className={cn(
              styles.micBtn,
              isRecording && styles.recording,
              recordingState === 'processing' && styles.processing,
              disabled && styles.disabled
            )}
            onClick={handleMicClick}
            onMouseDown={() => {
              if (currentMode === 'push-to-talk' && !disabled && !muted) {
                startRecording();
              }
            }}
            onMouseUp={() => {
              if (currentMode === 'push-to-talk') {
                stopRecording();
              }
            }}
            onMouseLeave={() => {
              if (currentMode === 'push-to-talk' && isRecording) {
                stopRecording();
              }
            }}
            disabled={disabled || muted}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {getStateIcon()}
          </button>
        </div>

        {/* Mode Selector */}
        <div className={styles.modeSelector}>
          <button
            className={styles.controlBtn}
            onClick={() => setShowModeMenu(!showModeMenu)}
            title="Voice Mode"
            aria-label="Select voice mode"
          >
            <Settings2 size={18} />
          </button>

          {showModeMenu && (
            <div className={styles.modeMenu}>
              <div className={styles.modeMenuHeader}>Voice Mode</div>
              {(['off', 'toggle', 'push-to-talk', 'vad'] as VoiceMode[]).map((mode) => (
                <button
                  key={mode}
                  className={cn(
                    styles.modeOption,
                    currentMode === mode && styles.modeActive
                  )}
                  onClick={() => handleModeChange(mode)}
                >
                  {getModeIcon(mode)}
                  <span>{getModeLabel(mode)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Label */}
      <div className={styles.statusLabel}>
        <span className={cn(
          styles.statusDot,
          isRecording && styles.statusRecording,
          recordingState === 'processing' && styles.statusProcessing
        )} />
        <span>{getStateLabel()}</span>
      </div>
    </div>
  );
}
