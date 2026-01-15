'use client';

/**
 * RequestsPanel
 *
 * Displays service requests from Coperniq /requests endpoint.
 * Features: priority queue, status tracking, quick actions.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Inbox,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MapPin,
  Clock,
  AlertTriangle,
  User,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { getRequests, ServiceRequest, PriorityCounts } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import styles from './RequestsPanel.module.css';

// Priority display config
const priorityConfig: Record<ServiceRequest['priority'], { label: string; color: string; icon: string }> = {
  emergency: { label: 'Emergency', color: '#ef4444', icon: '🚨' },
  high: { label: 'High', color: '#f59e0b', icon: '⚠️' },
  normal: { label: 'Normal', color: '#3b82f6', icon: '📋' },
  low: { label: 'Low', color: '#6b7280', icon: '📝' },
};

// Status display config
const statusConfig: Record<ServiceRequest['status'], { label: string; color: string }> = {
  new: { label: 'New', color: '#22c55e' },
  contacted: { label: 'Contacted', color: '#3b82f6' },
  scheduled: { label: 'Scheduled', color: '#8b5cf6' },
  converted: { label: 'Converted', color: '#6b7280' },
};

// Source display config
const sourceConfig: Record<ServiceRequest['source'], { label: string; icon: React.ElementType }> = {
  phone: { label: 'Phone', icon: Phone },
  email: { label: 'Email', icon: Mail },
  web: { label: 'Web Form', icon: FileText },
  sms: { label: 'SMS', icon: MessageSquare },
  'walk-in': { label: 'Walk-in', icon: User },
  other: { label: 'Other', icon: Inbox },
};

type PriorityFilter = 'all' | ServiceRequest['priority'];

export function RequestsPanel() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [priorityCounts, setPriorityCounts] = useState<PriorityCounts>({
    all: 0,
    emergency: 0,
    high: 0,
    normal: 0,
    low: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch requests
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getRequests();
      setRequests(response.requests || []);
      setPriorityCounts(response.priorityCounts || {
        all: 0,
        emergency: 0,
        high: 0,
        normal: 0,
        low: 0,
      });
    } catch (err) {
      setError('Failed to load service requests');
      console.error('Requests fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Filter requests by priority
  const filteredRequests = requests.filter((request) => {
    return priorityFilter === 'all' || request.priority === priorityFilter;
  });

  // Sort by priority (emergency first) then by createdAt (newest first)
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const priorityOrder = { emergency: 0, high: 1, normal: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Inbox size={18} />
          <h2>Service Requests</h2>
          <span className={styles.count}>{sortedRequests.length}</span>
        </div>
        <div className={styles.headerRight}>
          {priorityCounts.emergency > 0 && (
            <span className={styles.emergencyBadge}>
              {priorityCounts.emergency} 🚨
            </span>
          )}
          <button
            className={styles.refreshBtn}
            onClick={fetchRequests}
            disabled={loading}
            title="Refresh requests"
          >
            <RefreshCw size={16} className={loading ? styles.spinning : ''} />
          </button>
        </div>
      </div>

      {/* Priority Filter Tabs */}
      <div className={styles.priorityTabs}>
        <button
          className={`${styles.priorityTab} ${priorityFilter === 'all' ? styles.active : ''}`}
          onClick={() => setPriorityFilter('all')}
        >
          All <span className={styles.tabCount}>{priorityCounts.all}</span>
        </button>
        <button
          className={`${styles.priorityTab} ${priorityFilter === 'emergency' ? styles.active : ''}`}
          onClick={() => setPriorityFilter('emergency')}
          style={{ '--priority-color': priorityConfig.emergency.color } as React.CSSProperties}
        >
          🚨 <span className={styles.tabCount}>{priorityCounts.emergency}</span>
        </button>
        <button
          className={`${styles.priorityTab} ${priorityFilter === 'high' ? styles.active : ''}`}
          onClick={() => setPriorityFilter('high')}
          style={{ '--priority-color': priorityConfig.high.color } as React.CSSProperties}
        >
          High <span className={styles.tabCount}>{priorityCounts.high}</span>
        </button>
        <button
          className={`${styles.priorityTab} ${priorityFilter === 'normal' ? styles.active : ''}`}
          onClick={() => setPriorityFilter('normal')}
          style={{ '--priority-color': priorityConfig.normal.color } as React.CSSProperties}
        >
          Normal <span className={styles.tabCount}>{priorityCounts.normal}</span>
        </button>
        <button
          className={`${styles.priorityTab} ${priorityFilter === 'low' ? styles.active : ''}`}
          onClick={() => setPriorityFilter('low')}
          style={{ '--priority-color': priorityConfig.low.color } as React.CSSProperties}
        >
          Low <span className={styles.tabCount}>{priorityCounts.low}</span>
        </button>
      </div>

      {/* Request List */}
      <div className={styles.requestList}>
        {loading ? (
          <div className={styles.loadingState}>Loading service requests...</div>
        ) : error ? (
          <div className={styles.errorState}>{error}</div>
        ) : sortedRequests.length === 0 ? (
          <div className={styles.emptyState}>No service requests found</div>
        ) : (
          sortedRequests.map((request) => {
            const SourceIcon = sourceConfig[request.source]?.icon || Inbox;
            return (
              <div
                key={request.id}
                className={`${styles.requestCard} ${request.priority === 'emergency' ? styles.emergency : ''}`}
              >
                <div
                  className={styles.requestHeader}
                  onClick={() => toggleExpanded(request.id)}
                >
                  <div className={styles.requestMain}>
                    <div className={styles.requestTitle}>
                      <span
                        className={styles.priorityIcon}
                        title={priorityConfig[request.priority].label}
                      >
                        {priorityConfig[request.priority].icon}
                      </span>
                      <span>{request.title}</span>
                      {request.trade && (
                        <span className={styles.tradeBadge}>{request.trade}</span>
                      )}
                    </div>
                    <div className={styles.requestMeta}>
                      <span
                        className={styles.statusBadge}
                        style={{ backgroundColor: statusConfig[request.status].color }}
                      >
                        {statusConfig[request.status].label}
                      </span>
                      <span className={styles.customerName}>
                        <User size={12} />
                        {request.customer}
                      </span>
                      <span className={styles.sourceInfo}>
                        <SourceIcon size={12} />
                        {sourceConfig[request.source]?.label || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.requestRight}>
                    <span className={styles.timeAgo}>
                      <Clock size={12} />
                      {formatRelativeTime(request.createdAt)}
                    </span>
                    <button className={styles.expandBtn}>
                      {expandedId === request.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === request.id && (
                  <div className={styles.requestDetails}>
                    {request.description && (
                      <div className={styles.description}>
                        {request.description}
                      </div>
                    )}

                    <div className={styles.detailsGrid}>
                      {request.customerPhone && (
                        <div className={styles.detailRow}>
                          <Phone size={14} />
                          <a href={`tel:${request.customerPhone}`} className={styles.link}>
                            {request.customerPhone}
                          </a>
                        </div>
                      )}
                      {request.customerEmail && (
                        <div className={styles.detailRow}>
                          <Mail size={14} />
                          <a href={`mailto:${request.customerEmail}`} className={styles.link}>
                            {request.customerEmail}
                          </a>
                        </div>
                      )}
                      {request.address && (
                        <div className={styles.detailRow}>
                          <MapPin size={14} />
                          <span>{request.address}</span>
                        </div>
                      )}
                    </div>

                    {request.notes && (
                      <div className={styles.notes}>
                        <AlertTriangle size={14} />
                        <span>{request.notes}</span>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className={styles.quickActions}>
                      <button className={styles.actionBtn}>
                        <Phone size={14} />
                        Call
                      </button>
                      <button className={styles.actionBtn}>
                        <Mail size={14} />
                        Email
                      </button>
                      <button className={`${styles.actionBtn} ${styles.primary}`}>
                        <FileText size={14} />
                        Create Work Order
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default RequestsPanel;
