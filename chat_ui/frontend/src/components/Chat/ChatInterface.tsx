'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Trash2,
  RefreshCw,
  Zap,
  User,
  MessageSquare,
  Paperclip,
  X,
  Image as ImageIcon,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { cn, generateId, formatMessageTime } from '@/lib/utils';
import { sendChatMessage, sendChatMessageWithImage, speakAndPlay } from '@/lib/api';
import { getAgentById, DEFAULT_QUICK_ACTIONS, TRADE_AGENTS, type QuickAction, type TradeAgent } from '@/lib/trade-agents';
import type { ChatMessage } from '@/types';
import styles from './ChatInterface.module.css';
import { VoiceInput } from '@/components/VoiceInput';
import { VoiceSettings } from '@/components/VoiceSettings';

interface ChatInterfaceProps {
  initialMessage?: string;
  onClear?: () => void;
  selectedTrade?: string;
  onTradeChange?: (trade: string) => void;
  triggerVoiceSettings?: boolean;  // External trigger to open voice settings
  onVoiceSettingsClosed?: () => void;  // Callback when voice settings closes
}

export default function ChatInterface({
  initialMessage,
  onClear,
  selectedTrade,
  onTradeChange,
  triggerVoiceSettings,
  onVoiceSettingsClosed,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTrade, setActiveTrade] = useState<string>(selectedTrade || '');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [currentVoiceId, setCurrentVoiceId] = useState('a0e99841-438c-4a64-b679-ae501e7d6091'); // Mark (Professional)
  const [currentEmotion, setCurrentEmotion] = useState('professional');
  const [voiceEnabled, setVoiceEnabled] = useState(false); // TTS on/off
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current agent and quick actions
  const currentAgent: TradeAgent | undefined = activeTrade ? getAgentById(activeTrade) : undefined;
  const quickActions: QuickAction[] = currentAgent?.quickActions || DEFAULT_QUICK_ACTIONS;

  // Sync with external trade selection
  useEffect(() => {
    if (selectedTrade !== undefined) {
      setActiveTrade(selectedTrade);
    }
  }, [selectedTrade]);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle initial message from quick actions
  useEffect(() => {
    if (initialMessage) {
      handleSend(initialMessage);
    }
  }, [initialMessage]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Please select an image or PDF file');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFileName(file.name);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedImage(base64);
    };
    reader.readAsDataURL(file);
  };

  // Clear selected image
  const handleClearImage = () => {
    setSelectedImage(null);
    setSelectedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if ((!text && !selectedImage) || isLoading) return;

    // Clear input
    setInput('');
    const imageToSend = selectedImage;
    const fileNameToSend = selectedFileName;
    handleClearImage(); // Clear image preview

    // Add user message (with image indicator if present)
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: imageToSend
        ? `${text || 'Analyze this image'}\n📎 ${fileNameToSend}`
        : text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Show loading state
    setIsLoading(true);

    try {
      // Build conversation history for context
      const history = messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      // Use different API based on whether image is attached
      const response = imageToSend
        ? await sendChatMessageWithImage(
            text || 'Analyze this image and tell me what you see. Extract equipment details if relevant.',
            imageToSend,
            history,
            activeTrade || 'general'
          )
        : await sendChatMessage(text, history);

      // Add assistant message from Claude
      const responseText = response.message?.content || 'No response received';
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Speak the response if voice is enabled
      if (voiceEnabled && responseText) {
        setIsSpeaking(true);
        try {
          await speakAndPlay(responseText, currentVoiceId, currentEmotion);
        } catch (error) {
          console.error('[TTS] Failed to speak response:', error);
        } finally {
          setIsSpeaking(false);
        }
      }
    } catch (error) {
      // Add error message
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClear = () => {
    setMessages([]);
    onClear?.();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle voice transcript from VoiceInput
  const handleVoiceTranscript = useCallback((text: string) => {
    if (text.trim()) {
      // Enable voice responses when user speaks
      setVoiceEnabled(true);
      handleSend(text);
    }
  }, []);

  // Handle voice settings change
  const handleVoiceChange = useCallback((voiceId: string, emotion?: string) => {
    setCurrentVoiceId(voiceId);
    if (emotion) setCurrentEmotion(emotion);
    // Save to localStorage for persistence
    localStorage.setItem('voiceSettings', JSON.stringify({ voiceId, emotion }));
  }, []);

  // Load voice settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('voiceSettings');
    if (saved) {
      try {
        const { voiceId, emotion } = JSON.parse(saved);
        if (voiceId) setCurrentVoiceId(voiceId);
        if (emotion) setCurrentEmotion(emotion);
      } catch (e) {
        console.warn('Failed to load voice settings:', e);
      }
    }
  }, []);

  const handleQuickAction = (action: QuickAction) => {
    handleSend(action.prompt);
  };

  const handleTradeSelect = (tradeId: string) => {
    setActiveTrade(tradeId);
    onTradeChange?.(tradeId);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.headerTitle}>AI Assistant</h1>
          <p className={styles.headerSubtitle}>
            Powered by Claude | Coperniq Connected
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.iconBtn}
            onClick={handleClear}
            title="New Chat"
            disabled={!hasMessages}
          >
            <Trash2 size={18} />
          </button>
          <button
            className={styles.iconBtn}
            onClick={() => window.location.reload()}
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className={styles.messagesContainer}>
        {!hasMessages ? (
          // Welcome State with Trade Selection + Quick Actions
          <div className={styles.welcome}>
            <div className={styles.welcomeIcon}>
              {currentAgent ? (
                <span className={styles.tradeEmoji}>{currentAgent.emoji}</span>
              ) : (
                <Zap size={40} />
              )}
            </div>
            <h2 className={styles.welcomeTitle}>
              {currentAgent ? `${currentAgent.name} Assistant` : 'Welcome to Kipper Energy AI'}
            </h2>
            <p className={styles.welcomeText}>
              {currentAgent
                ? `Select a quick action or type your question below.`
                : 'Select a trade to get started, or ask me anything.'}
            </p>

            {/* Trade Selector Pills */}
            <div className={styles.tradePills}>
              {TRADE_AGENTS.map((agent) => (
                <button
                  key={agent.id}
                  className={cn(
                    styles.tradePill,
                    activeTrade === agent.id && styles.tradePillActive
                  )}
                  style={{
                    '--pill-color': agent.color,
                  } as React.CSSProperties}
                  onClick={() => handleTradeSelect(agent.id)}
                >
                  <span>{agent.emoji}</span>
                  <span>{agent.name}</span>
                </button>
              ))}
            </div>

            {/* Quick Actions - 3 Buttons */}
            <div className={styles.quickActions}>
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  className={styles.quickActionBtn}
                  onClick={() => handleQuickAction(action)}
                >
                  <span className={styles.quickActionIcon}>{action.icon}</span>
                  <span className={styles.quickActionLabel}>{action.label}</span>
                </button>
              ))}
            </div>

            {/* Or Type Custom */}
            <div className={styles.orDivider}>
              <span>or type your question below</span>
            </div>
          </div>
        ) : (
          // Messages List
          <div className={styles.messagesList}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  styles.message,
                  message.role === 'user' ? styles.userMessage : styles.assistantMessage
                )}
              >
                <div className={styles.messageAvatar}>
                  {message.role === 'assistant' ? (
                    <Zap size={18} />
                  ) : (
                    <User size={18} />
                  )}
                </div>
                <div className={styles.messageBody}>
                  <div className={styles.messageContent}>{message.content}</div>
                  <div className={styles.messageTime}>
                    {formatMessageTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className={cn(styles.message, styles.assistantMessage)}>
                <div className={styles.messageAvatar}>
                  <Zap size={18} />
                </div>
                <div className={styles.typingIndicator}>
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className={styles.inputArea}>
        {/* Image Preview */}
        {selectedImage && (
          <div className={styles.imagePreview}>
            <div className={styles.imagePreviewContent}>
              <ImageIcon size={16} />
              <span className={styles.imagePreviewName}>{selectedFileName}</span>
              <button
                className={styles.imagePreviewClose}
                onClick={handleClearImage}
                aria-label="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
        <div className={styles.inputContainer}>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          {/* Attachment button */}
          <button
            className={styles.attachBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            aria-label="Attach file"
            title="Upload photo or blueprint"
          >
            <Paperclip size={18} />
          </button>
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder={selectedImage ? "Describe what you'd like to know about this image..." : "Ask about services, scheduling, pricing..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            className={styles.sendBtn}
            onClick={() => handleSend()}
            disabled={(!input.trim() && !selectedImage) || isLoading}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>

        {/* Voice Input Controls */}
        <div className={styles.voiceControls}>
          {/* Voice Output Toggle - Enable TTS responses */}
          <button
            className={cn(styles.voiceToggleBtn, voiceEnabled && styles.voiceToggleActive)}
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            title={voiceEnabled ? 'Disable voice responses' : 'Enable voice responses'}
            aria-label={voiceEnabled ? 'Disable voice responses' : 'Enable voice responses'}
          >
            {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            onError={(err) => console.error('Voice error:', err)}
            disabled={isLoading}
          />
          <button
            className={styles.voiceSettingsBtn}
            onClick={() => setShowVoiceSettings(true)}
            title="Voice Settings"
            aria-label="Open voice settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Voice Settings Modal */}
      {showVoiceSettings && (
        <div className={styles.modalOverlay} onClick={() => setShowVoiceSettings(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <VoiceSettings
              currentVoiceId={currentVoiceId}
              currentEmotion={currentEmotion}
              onVoiceChange={handleVoiceChange}
              onClose={() => setShowVoiceSettings(false)}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={styles.footer}>
        <div>HVAC | Plumbing | Electrical | Solar | Low Voltage | Fire & Safety | Roofing</div>
        <div className={styles.footerPowered}>Powered by Coperniq OS</div>
      </footer>
    </div>
  );
}
