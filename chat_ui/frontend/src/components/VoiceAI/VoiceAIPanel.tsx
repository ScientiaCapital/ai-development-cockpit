'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneOff,
  Pause,
  Play,
  Mic,
  MicOff,
  Volume2,
  Clock,
  User,
  MessageSquare,
  Activity,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { cn, formatDuration, formatPhoneNumber } from '@/lib/utils';
import type { VoiceCall, CallStatus } from '@/types';
import styles from './VoiceAIPanel.module.css';

// Mock active calls for demonstration
const mockCalls: VoiceCall[] = [
  {
    id: '1',
    callerName: 'John Smith',
    callerPhone: '+12055551234',
    direction: 'inbound',
    status: 'active',
    duration: 127,
    startTime: new Date(Date.now() - 127000).toISOString(),
    transcriptPreview: 'I need to schedule an AC repair for tomorrow...',
  },
  {
    id: '2',
    callerName: 'Sarah Johnson',
    callerPhone: '+14045559876',
    direction: 'outbound',
    status: 'ringing',
    duration: 0,
    startTime: new Date().toISOString(),
    transcriptPreview: 'Calling about service appointment confirmation...',
  },
];

interface VoiceAIPanelProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function VoiceAIPanel({ collapsed = false, onToggle }: VoiceAIPanelProps) {
  const [calls, setCalls] = useState<VoiceCall[]>(mockCalls);
  const [expandedCall, setExpandedCall] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  // Update call durations
  useEffect(() => {
    const interval = setInterval(() => {
      setCalls((prev) =>
        prev.map((call) => {
          if (call.status === 'active') {
            const startTime = new Date(call.startTime).getTime();
            const duration = Math.floor((Date.now() - startTime) / 1000);
            return { ...call, duration };
          }
          return call;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleEndCall = useCallback((callId: string) => {
    setCalls((prev) =>
      prev.map((call) =>
        call.id === callId ? { ...call, status: 'ended' as CallStatus } : call
      )
    );
    // Remove ended calls after animation
    setTimeout(() => {
      setCalls((prev) => prev.filter((call) => call.id !== callId));
    }, 500);
  }, []);

  const handleHoldCall = useCallback((callId: string) => {
    setCalls((prev) =>
      prev.map((call) =>
        call.id === callId
          ? { ...call, status: call.status === 'on_hold' ? 'active' : 'on_hold' }
          : call
      )
    );
  }, []);

  const toggleExpanded = (callId: string) => {
    setExpandedCall((prev) => (prev === callId ? null : callId));
  };

  const activeCalls = calls.filter((c) => c.status !== 'ended');
  const activeCount = activeCalls.filter((c) => c.status === 'active').length;

  const getStatusColor = (status: CallStatus): string => {
    switch (status) {
      case 'active':
        return 'var(--color-success)';
      case 'ringing':
        return 'var(--color-warning)';
      case 'on_hold':
        return 'var(--color-info)';
      default:
        return 'var(--text-muted)';
    }
  };

  const getStatusLabel = (status: CallStatus): string => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'ringing':
        return 'Ringing';
      case 'on_hold':
        return 'On Hold';
      case 'ended':
        return 'Ended';
      default:
        return status;
    }
  };

  if (collapsed) {
    return (
      <div className={cn(styles.panel, styles.collapsed)} onClick={onToggle}>
        <div className={styles.collapsedContent}>
          <Phone size={20} />
          {activeCount > 0 && (
            <span className={styles.activeBadge}>{activeCount}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={cn(styles.statusIndicator, isConnected && styles.connected)} />
          <span className={styles.headerTitle}>Voice AI</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.callCount}>
            {activeCount} active {activeCount === 1 ? 'call' : 'calls'}
          </span>
          {onToggle && (
            <button className={styles.collapseBtn} onClick={onToggle}>
              <ChevronUp size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Calls List */}
      <div className={styles.callsList}>
        {activeCalls.length === 0 ? (
          <div className={styles.empty}>
            <Phone size={32} className={styles.emptyIcon} />
            <span>No active calls</span>
            <span className={styles.emptySubtext}>Voice AI is ready to handle calls</span>
          </div>
        ) : (
          activeCalls.map((call) => (
            <div
              key={call.id}
              className={cn(
                styles.callCard,
                expandedCall === call.id && styles.expanded,
                call.status === 'ended' && styles.ending
              )}
            >
              {/* Call Header */}
              <div className={styles.callHeader} onClick={() => toggleExpanded(call.id)}>
                <div className={styles.callDirection}>
                  {call.direction === 'inbound' ? (
                    <PhoneIncoming size={16} className={styles.inbound} />
                  ) : (
                    <PhoneOutgoing size={16} className={styles.outbound} />
                  )}
                </div>

                <div className={styles.callInfo}>
                  <div className={styles.callerName}>{call.callerName}</div>
                  <div className={styles.callerPhone}>
                    {formatPhoneNumber(call.callerPhone)}
                  </div>
                </div>

                <div className={styles.callMeta}>
                  <div
                    className={styles.callStatus}
                    style={{ color: getStatusColor(call.status) }}
                  >
                    <Activity size={12} />
                    <span>{getStatusLabel(call.status)}</span>
                  </div>
                  <div className={styles.callDuration}>
                    <Clock size={12} />
                    <span>{formatDuration(call.duration)}</span>
                  </div>
                </div>

                <button className={styles.expandBtn}>
                  {expandedCall === call.id ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
              </div>

              {/* Expanded Content */}
              {expandedCall === call.id && (
                <div className={styles.callExpanded}>
                  {/* Transcript Preview */}
                  {call.transcriptPreview && (
                    <div className={styles.transcript}>
                      <MessageSquare size={14} />
                      <span>{call.transcriptPreview}</span>
                    </div>
                  )}

                  {/* Call Actions */}
                  <div className={styles.callActions}>
                    <button
                      className={cn(styles.actionBtn, styles.holdBtn)}
                      onClick={() => handleHoldCall(call.id)}
                      title={call.status === 'on_hold' ? 'Resume' : 'Hold'}
                    >
                      {call.status === 'on_hold' ? (
                        <Play size={18} />
                      ) : (
                        <Pause size={18} />
                      )}
                    </button>

                    <button
                      className={cn(styles.actionBtn, styles.muteBtn)}
                      title="Mute"
                    >
                      <MicOff size={18} />
                    </button>

                    <button
                      className={cn(styles.actionBtn, styles.volumeBtn)}
                      title="Volume"
                    >
                      <Volume2 size={18} />
                    </button>

                    <button
                      className={cn(styles.actionBtn, styles.endBtn)}
                      onClick={() => handleEndCall(call.id)}
                      title="End Call"
                    >
                      <PhoneOff size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* Waveform Indicator */}
              {call.status === 'active' && (
                <div className={styles.waveform}>
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className={styles.waveformBar}
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Stats Footer */}
      <div className={styles.footer}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{calls.length}</span>
          <span className={styles.statLabel}>Today</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>4.2m</span>
          <span className={styles.statLabel}>Avg Duration</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>92%</span>
          <span className={styles.statLabel}>Resolved</span>
        </div>
      </div>
    </div>
  );
}
