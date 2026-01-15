'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MapPin,
  User,
  Wrench,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Filter,
  Thermometer,
  Droplets,
  Zap,
  Sun,
  Flame,
  Play,
  Check,
  UserPlus,
  MessageSquare,
  Phone,
  Wifi,
  AlertTriangle,
  Home,
} from 'lucide-react';
import { cn, getStatusColor, formatRelativeTime, getTradeColor } from '@/lib/utils';
import { getWorkOrders, updateWorkOrderStatus } from '@/lib/api';
import type { WorkOrder, WorkOrderStatus, WorkOrderPriority, TradeName } from '@/types';
import styles from './WorkOrdersPanel.module.css';

// Extended trade types for full team coverage
type ExtendedTrade = TradeName | 'Low Voltage' | 'Roofing' | 'General';

// Trade icon mapping - all teams
const tradeIconMap: Record<string, React.ElementType> = {
  HVAC: Thermometer,
  Plumbing: Droplets,
  Electrical: Zap,
  Solar: Sun,
  'Fire Protection': Flame,
  'Fire & Safety': AlertTriangle,
  'Low Voltage': Wifi,
  Roofing: Home,
  General: Wrench,
};

// Trade colors
const tradeColorMap: Record<string, string> = {
  HVAC: '#ef4444',
  Plumbing: '#3b82f6',
  Electrical: '#f59e0b',
  Solar: '#22c55e',
  'Fire Protection': '#dc2626',
  'Fire & Safety': '#dc2626',
  'Low Voltage': '#8b5cf6',
  Roofing: '#78716c',
  General: '#6b7280',
};

// Status icon mapping
const statusIconMap: Record<WorkOrderStatus, React.ElementType> = {
  pending: Clock,
  scheduled: Calendar,
  in_progress: Wrench,
  completed: CheckCircle2,
  cancelled: AlertCircle,
};

// Action buttons based on current status
const getStatusActions = (status: WorkOrderStatus): { label: string; nextStatus: WorkOrderStatus; icon: React.ElementType }[] => {
  switch (status) {
    case 'pending':
      return [
        { label: 'Schedule', nextStatus: 'scheduled', icon: Calendar },
        { label: 'Start Now', nextStatus: 'in_progress', icon: Play },
      ];
    case 'scheduled':
      return [
        { label: 'Start Work', nextStatus: 'in_progress', icon: Play },
      ];
    case 'in_progress':
      return [
        { label: 'Complete', nextStatus: 'completed', icon: Check },
      ];
    case 'completed':
      return [];
    case 'cancelled':
      return [
        { label: 'Reopen', nextStatus: 'pending', icon: RefreshCw },
      ];
    default:
      return [];
  }
};

interface WorkOrdersPanelProps {
  onWorkOrderSelect?: (workOrder: WorkOrder) => void;
  onChatAboutWorkOrder?: (workOrder: WorkOrder) => void;
  collapsed?: boolean;
  tradeFilter?: ExtendedTrade | 'all';
}

export default function WorkOrdersPanel({
  onWorkOrderSelect,
  onChatAboutWorkOrder,
  collapsed = false,
  tradeFilter = 'all',
}: WorkOrdersPanelProps) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'all'>('all');
  const [selectedTrade, setSelectedTrade] = useState<ExtendedTrade | 'all'>(tradeFilter);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  // Sync external trade filter
  useEffect(() => {
    setSelectedTrade(tradeFilter);
  }, [tradeFilter]);

  const fetchWorkOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getWorkOrders();
      setWorkOrders(data.work_orders || []);
    } catch (err) {
      console.error('Failed to fetch work orders:', err);
      setError('Failed to load work orders');
      setWorkOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle status change - updates UI optimistically and syncs to Coperniq
  const handleStatusChange = useCallback(async (workOrderId: string, newStatus: WorkOrderStatus) => {
    setUpdatingId(workOrderId);

    // Optimistic update
    setWorkOrders(prev => prev.map(wo =>
      wo.id === workOrderId ? { ...wo, status: newStatus } : wo
    ));

    try {
      // Sync to Coperniq Instance 388
      await updateWorkOrderStatus(workOrderId, newStatus);
      console.log(`✅ Updated ${workOrderId} to ${newStatus} in Coperniq`);
    } catch (err) {
      console.error('Failed to update status in Coperniq:', err);
      // Revert on failure
      fetchWorkOrders();
    } finally {
      setUpdatingId(null);
    }
  }, []);

  const toggleExpanded = (id: string) => {
    setExpandedCard(prev => prev === id ? null : id);
  };

  // Filter by both status and trade
  const filteredWorkOrders = workOrders.filter((wo) => {
    const matchesStatus = statusFilter === 'all' || wo.status === statusFilter;
    const woTrade = wo.trade as string; // Allow comparison with extended trades
    const matchesTrade = selectedTrade === 'all' || woTrade === selectedTrade || woTrade === 'General';
    return matchesStatus && matchesTrade;
  });

  // Status counts (filtered by trade if selected)
  const tradeFilteredOrders = selectedTrade === 'all'
    ? workOrders
    : workOrders.filter(wo => {
        const woTrade = wo.trade as string;
        return woTrade === selectedTrade || woTrade === 'General';
      });

  const statusCounts = {
    all: tradeFilteredOrders.length,
    pending: tradeFilteredOrders.filter((wo) => wo.status === 'pending').length,
    scheduled: tradeFilteredOrders.filter((wo) => wo.status === 'scheduled').length,
    in_progress: tradeFilteredOrders.filter((wo) => wo.status === 'in_progress').length,
    completed: tradeFilteredOrders.filter((wo) => wo.status === 'completed').length,
  };

  // Get unique trades from work orders for trade filter tabs
  const uniqueTrades = ['all', ...new Set(workOrders.map(wo => wo.trade).filter(Boolean))];

  if (collapsed) {
    return (
      <aside className={cn(styles.panel, styles.collapsed)}>
        <div className={styles.collapsedIcon} title="Work Orders">
          <FileText size={20} />
          {statusCounts.pending + statusCounts.in_progress > 0 && (
            <span className={styles.badge}>
              {statusCounts.pending + statusCounts.in_progress}
            </span>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <FileText size={20} />
          <span>Work Orders</span>
        </div>
        <button
          className={styles.refreshBtn}
          onClick={fetchWorkOrders}
          disabled={isLoading}
          title="Refresh"
        >
          <RefreshCw size={16} className={isLoading ? styles.spinning : ''} />
        </button>
      </div>

      {/* Trade Filter Tabs */}
      <div className={styles.tradeTabs}>
        {uniqueTrades.map((trade) => {
          const TradeIcon = trade === 'all' ? FileText : (tradeIconMap[trade as string] || Wrench);
          const tradeColor = trade === 'all' ? '#6b7280' : (tradeColorMap[trade as string] || '#6b7280');
          return (
            <button
              key={trade}
              className={cn(styles.tradeTab, selectedTrade === trade && styles.active)}
              onClick={() => setSelectedTrade(trade as ExtendedTrade | 'all')}
              title={trade === 'all' ? 'All Trades' : trade}
              style={{ '--trade-color': tradeColor } as React.CSSProperties}
            >
              <TradeIcon size={14} />
            </button>
          );
        })}
      </div>

      {/* Status Filter Tabs */}
      <div className={styles.filters}>
        {(['all', 'pending', 'scheduled', 'in_progress'] as const).map((status) => (
          <button
            key={status}
            className={cn(styles.filterTab, statusFilter === status && styles.active)}
            onClick={() => setStatusFilter(status)}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ')}
            <span className={styles.filterCount}>{statusCounts[status]}</span>
          </button>
        ))}
      </div>

      {/* Work Orders List */}
      <div className={styles.list}>
        {isLoading ? (
          <div className={styles.loading}>
            <RefreshCw size={24} className={styles.spinning} />
            <span>Loading work orders...</span>
          </div>
        ) : error ? (
          <div className={styles.error}>
            <AlertCircle size={24} />
            <span>{error}</span>
            <button onClick={fetchWorkOrders}>Retry</button>
          </div>
        ) : filteredWorkOrders.length === 0 ? (
          <div className={styles.empty}>
            <FileText size={32} />
            <span>No work orders found</span>
          </div>
        ) : (
          filteredWorkOrders.map((workOrder) => {
            const TradeIcon = tradeIconMap[workOrder.trade] || Wrench;
            const StatusIcon = statusIconMap[workOrder.status] || Clock;
            const isExpanded = expandedCard === workOrder.id;
            const isUpdating = updatingId === workOrder.id;
            const actions = getStatusActions(workOrder.status);

            return (
              <div
                key={workOrder.id}
                className={cn(
                  styles.workOrderCard,
                  isExpanded && styles.expanded,
                  isUpdating && styles.updating
                )}
                onClick={() => toggleExpanded(workOrder.id)}
              >
                <div className={styles.cardHeader}>
                  <div
                    className={styles.tradeIcon}
                    style={{ background: getTradeColor(workOrder.trade) }}
                  >
                    <TradeIcon size={16} />
                  </div>
                  <div className={styles.cardInfo}>
                    <h4 className={styles.cardTitle}>{workOrder.title}</h4>
                    <span className={styles.cardTrade}>{workOrder.trade}</span>
                  </div>
                  <div
                    className={styles.statusBadge}
                    style={{ background: `${getStatusColor(workOrder.status)}20`, color: getStatusColor(workOrder.status) }}
                  >
                    <StatusIcon size={12} />
                    <span>{workOrder.status.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardDetail}>
                    <User size={14} />
                    <span>{workOrder.customer}</span>
                  </div>
                  {workOrder.address && (
                    <div className={styles.cardDetail}>
                      <MapPin size={14} />
                      <span>{workOrder.address}</span>
                    </div>
                  )}
                  {workOrder.scheduledDate && (
                    <div className={styles.cardDetail}>
                      <Calendar size={14} />
                      <span>{new Date(workOrder.scheduledDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.cardTime}>
                    {formatRelativeTime(workOrder.createdAt)}
                  </span>
                  {workOrder.technicianName && (
                    <span className={styles.technician}>
                      <User size={12} />
                      {workOrder.technicianName}
                    </span>
                  )}
                  <ChevronRight size={16} className={styles.chevron} />
                </div>

                {/* Action Buttons - Shown when expanded */}
                {isExpanded && actions.length > 0 && (
                  <div className={styles.cardActions}>
                    {actions.map((action) => {
                      const ActionIcon = action.icon;
                      return (
                        <button
                          key={action.nextStatus}
                          className={cn(
                            styles.actionBtn,
                            action.nextStatus === 'completed' && styles.success,
                            action.nextStatus === 'in_progress' && styles.primary
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(workOrder.id, action.nextStatus);
                          }}
                          disabled={isUpdating}
                        >
                          <ActionIcon size={14} />
                          <span>{action.label}</span>
                        </button>
                      );
                    })}
                    {/* Chat about this work order */}
                    {onChatAboutWorkOrder && (
                      <button
                        className={styles.chatBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          onChatAboutWorkOrder(workOrder);
                        }}
                        title="Chat about this work order"
                      >
                        <MessageSquare size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
