'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Trash2,
  RefreshCw,
  Zap,
  User,
  Calendar,
  DollarSign,
  MapPin,
  FileText,
} from 'lucide-react';
import { cn, generateId, formatMessageTime } from '@/lib/utils';
import { sendChatMessage } from '@/lib/api';
import type { ChatMessage } from '@/types';
import styles from './ChatInterface.module.css';

interface Suggestion {
  icon: React.ElementType;
  label: string;
  query: string;
}

const suggestions: Suggestion[] = [
  { icon: Calendar, label: 'Schedule HVAC Service', query: 'I need to schedule an HVAC service call' },
  { icon: FileText, label: 'Service Plans', query: 'What are your service plans and pricing?' },
  { icon: MapPin, label: 'Service Area', query: 'Do you service my area?' },
  { icon: DollarSign, label: 'Get Quote', query: 'I need a quote for a new AC installation' },
];

interface ChatInterfaceProps {
  initialMessage?: string;
  onClear?: () => void;
}

export default function ChatInterface({ initialMessage, onClear }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    // Clear input
    setInput('');

    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
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

      const response = await sendChatMessage(text, history);

      // Add assistant message from Claude
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.message?.content || 'No response received',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
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

  const handleSuggestionClick = (query: string) => {
    handleSend(query);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.headerTitle}>AI Assistant</h1>
          <p className={styles.headerSubtitle}>
            Powered by Claude | Coperniq Instance 388
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
          // Welcome State
          <div className={styles.welcome}>
            <div className={styles.welcomeIcon}>
              <Zap size={40} />
            </div>
            <h2 className={styles.welcomeTitle}>Welcome to Kipper Energy AI</h2>
            <p className={styles.welcomeText}>
              I am your AI assistant for scheduling services, checking work orders,
              getting pricing estimates, and more.
            </p>
            <div className={styles.suggestions}>
              {suggestions.map((suggestion, index) => {
                const Icon = suggestion.icon;
                return (
                  <button
                    key={index}
                    className={styles.suggestionBtn}
                    onClick={() => handleSuggestionClick(suggestion.query)}
                  >
                    <Icon size={16} />
                    <span>{suggestion.label}</span>
                  </button>
                );
              })}
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
        <div className={styles.inputContainer}>
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder="Ask about services, scheduling, pricing..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            className={styles.sendBtn}
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        HVAC | Plumbing | Electrical | Solar | Fire Protection | Serving AL, GA, FL, TN
      </footer>
    </div>
  );
}
