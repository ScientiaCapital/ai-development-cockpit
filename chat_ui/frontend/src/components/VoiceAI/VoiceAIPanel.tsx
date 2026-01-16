'use client';

/**
 * Voice AI Status Panel
 *
 * Shows real voice assistant status - NOT fake phone calls.
 * Displays: voice enabled state, speaking indicator, quick controls.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  ChevronUp,
  Loader2,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import styles from './VoiceAIPanel.module.css';

interface VoiceAIPanelProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function VoiceAIPanel({ collapsed = false, onToggle }: VoiceAIPanelProps) {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Load voice enabled state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('voiceEnabled');
    if (saved === 'true') {
      setVoiceEnabled(true);
    }
  }, []);

  // Save voice enabled state
  const toggleVoice = useCallback(() => {
    const newState = !voiceEnabled;
    setVoiceEnabled(newState);
    localStorage.setItem('voiceEnabled', String(newState));
  }, [voiceEnabled]);

  if (collapsed) {
    return (
      <div className={cn(styles.panel, styles.collapsed)} onClick={onToggle}>
        <div className={styles.collapsedContent}>
          {voiceEnabled ? (
            <Mic size={20} className={styles.activeIcon} />
          ) : (
            <MicOff size={20} />
          )}
          {voiceEnabled && <span className={styles.activeDot} />}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={cn(styles.statusIndicator, voiceEnabled && styles.connected)} />
          <span className={styles.headerTitle}>Voice AI</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.statusText}>
            {voiceEnabled ? 'Ready' : 'Disabled'}
          </span>
          {onToggle && (
            <button className={styles.collapseBtn} onClick={onToggle}>
              <ChevronUp size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Voice Status */}
      <div className={styles.voiceStatus}>
        {/* Main Voice Toggle */}
        <div className={styles.mainToggle}>
          <button
            className={cn(
              styles.voiceBtn,
              voiceEnabled && styles.voiceBtnActive,
              isListening && styles.listening,
              isSpeaking && styles.speaking
            )}
            onClick={toggleVoice}
            aria-label={voiceEnabled ? 'Disable voice' : 'Enable voice'}
          >
            {isSpeaking ? (
              <Volume2 size={32} className={styles.speakingIcon} />
            ) : isListening ? (
              <Radio size={32} className={styles.listeningIcon} />
            ) : voiceEnabled ? (
              <Mic size={32} />
            ) : (
              <MicOff size={32} />
            )}

            {/* Pulse animation when active */}
            {(isListening || isSpeaking) && (
              <div className={styles.pulseRing} />
            )}
          </button>

          <div className={styles.toggleLabel}>
            {isSpeaking ? 'Speaking...' :
             isListening ? 'Listening...' :
             voiceEnabled ? 'Click mic in chat' : 'Click to enable'}
          </div>
        </div>

        {/* Status Info */}
        <div className={styles.statusInfo}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>TTS Engine</span>
            <span className={styles.infoValue}>Cartesia Sonic 3</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>STT Engine</span>
            <span className={styles.infoValue}>Deepgram Nova 2</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Latency</span>
            <span className={styles.infoValue}>~300ms</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className={styles.instructions}>
        <h4>How to use Voice AI</h4>
        <ol>
          <li>Click the mic button in the chat input</li>
          <li>Speak your question or command</li>
          <li>Claude will respond with voice</li>
        </ol>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerText}>
          Powered by Cartesia + Deepgram
        </div>
      </div>
    </div>
  );
}
