'use client';

/**
 * SchedulePanel
 *
 * Displays today's scheduled work orders in a timeline view.
 * Features: time slot visualization, technician assignments, status tracking.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  RefreshCw,
  Clock,
  User,
  MapPin,
  ChevronDown,
  ChevronUp,
  Phone,
  Navigation,
} from 'lucide-react';
import { getWorkOrders } from '@/lib/api';
import type { WorkOrder } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import styles from './SchedulePanel.module.css';

// Status display config (matches WorkOrderStatus type)
const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#6b7280' },
  scheduled: { label: 'Scheduled', color: '#3b82f6' },
  in_progress: { label: 'In Progress', color: '#8b5cf6' },
  completed: { label: 'Complete', color: '#22c55e' },
  cancelled: { label: 'Cancelled', color: '#ef4444' },
};

// Time slots for the day (6 AM - 8 PM)
const TIME_SLOTS = [
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM',
];

type ViewMode = 'timeline' | 'list';

export function SchedulePanel() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Get today's date string for filtering
  const today = useMemo(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }, []);

  // Fetch work orders
  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getWorkOrders();
      // Filter to today's scheduled work orders
      const todaysOrders = (response.work_orders || []).filter((wo) => {
        if (!wo.scheduledDate) return false;
        const woDate = wo.scheduledDate.split('T')[0];
        return woDate === today;
      });
      // Sort by scheduled time
      todaysOrders.sort((a, b) => {
        const timeA = a.scheduledDate || '';
        const timeB = b.scheduledDate || '';
        return timeA.localeCompare(timeB);
      });
      setWorkOrders(todaysOrders);
    } catch (err) {
      setError('Failed to load schedule');
      console.error('Schedule fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Group work orders by hour for timeline view
  const ordersByHour = useMemo(() => {
    const grouped: Record<string, WorkOrder[]> = {};
    TIME_SLOTS.forEach((slot) => {
      grouped[slot] = [];
    });

    workOrders.forEach((wo) => {
      if (wo.scheduledDate) {
        const date = new Date(wo.scheduledDate);
        const hour = date.getHours();
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        const slot = `${hour12}:00 ${ampm}`;
        if (grouped[slot]) {
          grouped[slot].push(wo);
        }
      }
    });

    return grouped;
  }, [workOrders]);

  // Stats
  const stats = useMemo(() => {
    const pending = workOrders.filter((wo) => wo.status === 'pending' || wo.status === 'scheduled').length;
    const inProgress = workOrders.filter((wo) => wo.status === 'in_progress').length;
    const completed = workOrders.filter((wo) => wo.status === 'completed').length;
    return { pending, inProgress, completed, total: workOrders.length };
  }, [workOrders]);

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatScheduledTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Calendar size={18} />
          <h2>Today's Schedule</h2>
          <span className={styles.date}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}
          </span>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'timeline' ? styles.active : ''}`}
              onClick={() => setViewMode('timeline')}
            >
              Timeline
            </button>
          </div>
          <button
            className={styles.refreshBtn}
            onClick={fetchSchedule}
            disabled={loading}
            title="Refresh schedule"
          >
            <RefreshCw size={16} className={loading ? styles.spinning : ''} />
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.total}</span>
          <span className={styles.statLabel}>Total</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue} style={{ color: '#3b82f6' }}>{stats.pending}</span>
          <span className={styles.statLabel}>Pending</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue} style={{ color: '#8b5cf6' }}>{stats.inProgress}</span>
          <span className={styles.statLabel}>Active</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue} style={{ color: '#22c55e' }}>{stats.completed}</span>
          <span className={styles.statLabel}>Done</span>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {loading ? (
          <div className={styles.loadingState}>Loading today's schedule...</div>
        ) : error ? (
          <div className={styles.errorState}>{error}</div>
        ) : workOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <Calendar size={32} />
            <p>No appointments scheduled for today</p>
          </div>
        ) : viewMode === 'list' ? (
          /* List View */
          <div className={styles.listView}>
            {workOrders.map((wo) => {
              const status = statusConfig[wo.status] || statusConfig.pending;
              return (
                <div key={wo.id} className={styles.scheduleCard}>
                  <div
                    className={styles.cardHeader}
                    onClick={() => toggleExpanded(wo.id)}
                  >
                    <div className={styles.cardTime}>
                      <Clock size={14} />
                      <span>{wo.scheduledDate ? formatScheduledTime(wo.scheduledDate) : 'TBD'}</span>
                    </div>
                    <div className={styles.cardMain}>
                      <div className={styles.cardTitle}>{wo.title}</div>
                      <div className={styles.cardMeta}>
                        <span
                          className={styles.statusBadge}
                          style={{ backgroundColor: status.color }}
                        >
                          {status.label}
                        </span>
                        {wo.customer && (
                          <span className={styles.customer}>
                            <User size={12} />
                            {wo.customer}
                          </span>
                        )}
                        {wo.technicianName && (
                          <span className={styles.technician}>
                            <User size={12} />
                            Tech: {wo.technicianName}
                          </span>
                        )}
                      </div>
                    </div>
                    <button className={styles.expandBtn}>
                      {expandedId === wo.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {expandedId === wo.id && (
                    <div className={styles.cardDetails}>
                      {wo.description && (
                        <p className={styles.description}>{wo.description}</p>
                      )}
                      {wo.address && (
                        <div className={styles.detailRow}>
                          <MapPin size={14} />
                          <span>{wo.address}</span>
                        </div>
                      )}
                      <div className={styles.quickActions}>
                        <button className={styles.actionBtn}>
                          <Phone size={14} />
                          Call Customer
                        </button>
                        <button className={styles.actionBtn}>
                          <Navigation size={14} />
                          Navigate
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Timeline View */
          <div className={styles.timelineView}>
            {TIME_SLOTS.map((slot) => {
              const orders = ordersByHour[slot] || [];
              const hasOrders = orders.length > 0;

              return (
                <div
                  key={slot}
                  className={`${styles.timeSlot} ${hasOrders ? styles.hasOrders : ''}`}
                >
                  <div className={styles.timeLabel}>{slot}</div>
                  <div className={styles.slotContent}>
                    {orders.map((wo) => {
                      const status = statusConfig[wo.status] || statusConfig.pending;
                      return (
                        <div
                          key={wo.id}
                          className={styles.timelineCard}
                          style={{ borderLeftColor: status.color }}
                        >
                          <div className={styles.timelineTitle}>{wo.title}</div>
                          <div className={styles.timelineMeta}>
                            {wo.customer && <span>{wo.customer}</span>}
                            {wo.technicianName && <span>• {wo.technicianName}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SchedulePanel;
