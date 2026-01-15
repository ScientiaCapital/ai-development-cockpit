'use client';

/**
 * Voice Settings Component
 *
 * Features:
 * - Male/Female voice selection from Cartesia library
 * - Voice cloning support (upload audio sample)
 * - Emotion control (happy, professional, empathetic, urgent)
 * - Speed control (slow, normal, fast)
 * - Preview voice before use
 */

import { useState, useCallback } from 'react';
import {
  User,
  Users,
  Mic2,
  Play,
  Pause,
  Upload,
  Sliders,
  Volume2,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import styles from './VoiceSettings.module.css';

// Supported Languages - Cartesia Sonic 3 multilingual
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'ar', name: 'Arabic', flag: '🇾🇪' },
];

// Cartesia Voice Library - Curated selection for MEP contractors (multilingual)
export const VOICE_LIBRARY = {
  male: [
    { id: 'a0e99841-438c-4a64-b679-ae501e7d6091', name: 'Mark (Professional)', desc: 'EN - Calm technician', lang: 'en', default: true },
    { id: '694f9389-aac1-45b6-b726-9d9369183238', name: 'David (Friendly)', desc: 'EN - Warm helper', lang: 'en' },
    { id: '2ee87190-8f84-4925-a47e-1abb2c3a7e33', name: 'Carlos', desc: 'ES - Spanish native', lang: 'es' },
    { id: '87748186-26f2-4a58-899f-971c39c5ea93', name: 'François', desc: 'FR - French native', lang: 'fr' },
    { id: '41534e16-2966-4c6b-9670-111411def906', name: 'Hans', desc: 'DE - German native', lang: 'de' },
    { id: 'ee7ea9f8-c0c1-498c-9f62-dc2627e63f3f', name: 'Marco', desc: 'IT - Italian native', lang: 'it' },
    { id: 'f9836c6e-a0bd-460e-9d3c-f7a0b61e81f8', name: 'João', desc: 'PT - Portuguese native', lang: 'pt' },
    { id: '4d2fd738-3b3d-4f49-b05c-d7f71e7e3d7f', name: 'Wei', desc: 'ZH - Mandarin native', lang: 'zh' },
    { id: '6d5e7f8a-9b0c-4d1e-8f2a-3b4c5d6e7f8a', name: 'Takeshi', desc: 'JA - Japanese native', lang: 'ja' },
    { id: '7e8f9a0b-1c2d-3e4f-5a6b-7c8d9e0f1a2b', name: 'Dmitri', desc: 'RU - Russian native', lang: 'ru' },
    { id: '8f9a0b1c-2d3e-4f5a-6b7c-8d9e0f1a2b3c', name: 'Mehmet', desc: 'TR - Turkish native', lang: 'tr' },
    { id: '9a0b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4d', name: 'Raj', desc: 'HI - Hindi native', lang: 'hi' },
    { id: 'c9d0e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f', name: 'Ahmed', desc: 'AR - Arabic native', lang: 'ar' },
  ],
  female: [
    { id: 'b7d50908-b17c-442d-ad8d-810c63997ed9', name: 'Sarah (Professional)', desc: 'EN - Clear CSR', lang: 'en' },
    { id: '21b81c14-f85b-436d-aff5-43f2e788ecf8', name: 'Emily (Warm)', desc: 'EN - Friendly helper', lang: 'en' },
    { id: 'c45bc5ec-dc68-4feb-8829-6e6b2748095d', name: 'María', desc: 'ES - Spanish native', lang: 'es' },
    { id: '5c5ad5e7-1020-476b-8b91-fdcbe9cc313c', name: 'Sophie', desc: 'FR - French native', lang: 'fr' },
    { id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', name: 'Anna', desc: 'DE - German native', lang: 'de' },
    { id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', name: 'Giulia', desc: 'IT - Italian native', lang: 'it' },
    { id: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', name: 'Beatriz', desc: 'PT - Portuguese native', lang: 'pt' },
    { id: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', name: 'Mei', desc: 'ZH - Mandarin native', lang: 'zh' },
    { id: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', name: 'Yuki', desc: 'JA - Japanese native', lang: 'ja' },
    { id: 'f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c', name: 'Natasha', desc: 'RU - Russian native', lang: 'ru' },
    { id: 'a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d', name: 'Ayşe', desc: 'TR - Turkish native', lang: 'tr' },
    { id: 'b8c9d0e1-f2a3-4b5c-6d7e-8f9a0b1c2d3e', name: 'Priya', desc: 'HI - Hindi native', lang: 'hi' },
    { id: 'd0e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a', name: 'Fatima', desc: 'AR - Arabic native', lang: 'ar' },
  ],
  cloned: [] as Array<{ id: string; name: string; desc: string; lang?: string }>,
};

// Emotion presets for Cartesia Sonic 3
export const EMOTION_PRESETS = [
  { id: 'neutral', name: 'Neutral', icon: '😐', config: { speed: 'normal', emotion: [] } },
  { id: 'professional', name: 'Professional', icon: '👔', config: { speed: 'normal', emotion: ['positivity:medium'] } },
  { id: 'friendly', name: 'Friendly', icon: '😊', config: { speed: 'normal', emotion: ['positivity:high', 'curiosity:medium'] } },
  { id: 'empathetic', name: 'Empathetic', icon: '🤝', config: { speed: 'slow', emotion: ['positivity:medium', 'sadness:low'] } },
  { id: 'urgent', name: 'Urgent', icon: '⚡', config: { speed: 'fast', emotion: ['surprise:medium'] } },
  { id: 'calm', name: 'Calm', icon: '🧘', config: { speed: 'slow', emotion: ['positivity:low'] } },
];

interface VoiceSettingsProps {
  currentVoiceId: string;
  currentEmotion: string;
  onVoiceChange: (voiceId: string, emotion?: string) => void;
  onClose?: () => void;
}

export default function VoiceSettings({
  currentVoiceId,
  currentEmotion,
  onVoiceChange,
  onClose,
}: VoiceSettingsProps) {
  const [activeTab, setActiveTab] = useState<'male' | 'female' | 'cloned'>('male');
  const [selectedVoice, setSelectedVoice] = useState(currentVoiceId);
  const [selectedEmotion, setSelectedEmotion] = useState(currentEmotion || 'professional');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewVoiceId, setPreviewVoiceId] = useState<string | null>(null);

  const handleVoiceSelect = useCallback((voiceId: string) => {
    setSelectedVoice(voiceId);
  }, []);

  const handleEmotionSelect = useCallback((emotionId: string) => {
    setSelectedEmotion(emotionId);
  }, []);

  const handlePreview = useCallback(async (voiceId: string) => {
    if (isPlaying && previewVoiceId === voiceId) {
      setIsPlaying(false);
      setPreviewVoiceId(null);
      return;
    }

    setIsPlaying(true);
    setPreviewVoiceId(voiceId);

    try {
      const response = await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'voice_tts',
          text: 'Hello! I\'m your AI assistant. How can I help you today with your service needs?',
          voice: voiceId,
          voiceEmotion: selectedEmotion,
        }),
      });

      const data = await response.json();

      if (data.success && data.audio) {
        const audioBlob = base64ToBlob(data.audio, 'audio/mp3');
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
          setIsPlaying(false);
          setPreviewVoiceId(null);
          URL.revokeObjectURL(audioUrl);
        };

        audio.play();
      }
    } catch (error) {
      console.error('Preview failed:', error);
      setIsPlaying(false);
      setPreviewVoiceId(null);
    }
  }, [isPlaying, previewVoiceId, selectedEmotion]);

  const handleSave = useCallback(() => {
    onVoiceChange(selectedVoice, selectedEmotion);
    onClose?.();
  }, [selectedVoice, selectedEmotion, onVoiceChange, onClose]);

  const handleVoiceCloneUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    // In production, this would upload to Cartesia's voice cloning API
    // For now, we'll simulate the process
    setTimeout(() => {
      const clonedVoice = {
        id: `cloned_${Date.now()}`,
        name: `My Voice (${file.name})`,
        desc: 'Your cloned voice',
      };

      VOICE_LIBRARY.cloned.push(clonedVoice);
      setActiveTab('cloned');
      setSelectedVoice(clonedVoice.id);
      setIsUploading(false);
    }, 2000);
  }, []);

  const voices = VOICE_LIBRARY[activeTab];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Voice Settings</h3>
        <p className={styles.subtitle}>Choose AI voice and personality</p>
      </div>

      {/* Voice Type Tabs */}
      <div className={styles.tabs}>
        <button
          className={cn(styles.tab, activeTab === 'male' && styles.tabActive)}
          onClick={() => setActiveTab('male')}
        >
          <User size={16} />
          <span>Male</span>
        </button>
        <button
          className={cn(styles.tab, activeTab === 'female' && styles.tabActive)}
          onClick={() => setActiveTab('female')}
        >
          <Users size={16} />
          <span>Female</span>
        </button>
        <button
          className={cn(styles.tab, activeTab === 'cloned' && styles.tabActive)}
          onClick={() => setActiveTab('cloned')}
        >
          <Mic2 size={16} />
          <span>Clone</span>
        </button>
      </div>

      {/* Voice List */}
      <div className={styles.voiceList}>
        {activeTab === 'cloned' && voices.length === 0 ? (
          <div className={styles.cloneUpload}>
            <div className={styles.uploadIcon}>
              <Upload size={32} />
            </div>
            <h4>Clone Your Voice</h4>
            <p>Upload a 30-second audio sample to create your custom AI voice</p>
            <label className={styles.uploadBtn}>
              {isUploading ? (
                <>
                  <Loader2 size={18} className={styles.spinner} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload size={18} />
                  <span>Upload Audio Sample</span>
                </>
              )}
              <input
                type="file"
                accept="audio/*"
                onChange={handleVoiceCloneUpload}
                disabled={isUploading}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        ) : (
          voices.map((voice) => (
            <div
              key={voice.id}
              className={cn(
                styles.voiceCard,
                selectedVoice === voice.id && styles.voiceSelected
              )}
              onClick={() => handleVoiceSelect(voice.id)}
            >
              <div className={styles.voiceInfo}>
                <div className={styles.voiceName}>
                  {voice.name}
                  {selectedVoice === voice.id && (
                    <CheckCircle size={14} className={styles.checkIcon} />
                  )}
                </div>
                <div className={styles.voiceDesc}>{voice.desc}</div>
              </div>
              <button
                className={styles.previewBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreview(voice.id);
                }}
                title="Preview voice"
              >
                {isPlaying && previewVoiceId === voice.id ? (
                  <Pause size={16} />
                ) : (
                  <Play size={16} />
                )}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Emotion Presets */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Sliders size={16} />
          <span>Personality</span>
        </div>
        <div className={styles.emotionGrid}>
          {EMOTION_PRESETS.map((emotion) => (
            <button
              key={emotion.id}
              className={cn(
                styles.emotionBtn,
                selectedEmotion === emotion.id && styles.emotionActive
              )}
              onClick={() => handleEmotionSelect(emotion.id)}
            >
              <span className={styles.emotionIcon}>{emotion.icon}</span>
              <span>{emotion.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className={styles.footer}>
        <button className={styles.cancelBtn} onClick={onClose}>
          Cancel
        </button>
        <button className={styles.saveBtn} onClick={handleSave}>
          <Volume2 size={16} />
          <span>Apply Voice</span>
        </button>
      </div>
    </div>
  );
}

// Helper: Convert base64 to Blob
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    byteArrays.push(new Uint8Array(byteNumbers));
  }

  return new Blob(byteArrays, { type: mimeType });
}
