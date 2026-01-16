'use client';

/**
 * InvoicesPanel
 *
 * Displays invoice status from Coperniq /invoices endpoint.
 * Features: status filtering, aging analysis, payment tracking.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Receipt,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  FileText,
  Mail,
} from 'lucide-react';
import { getInvoices, Invoice, InvoiceStatusCounts, AgingBuckets } from '@/lib/api';
import { formatRelativeTime, cn } from '@/lib/utils';
import styles from './InvoicesPanel.module.css';

// Status display config
const statusConfig: Record<Invoice['status'], { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: '#6b7280', icon: FileText },
  sent: { label: 'Sent', color: '#3b82f6', icon: Send },
  viewed: { label: 'Viewed', color: '#8b5cf6', icon: CheckCircle2 },
  paid: { label: 'Paid', color: '#22c55e', icon: CheckCircle2 },
  overdue: { label: 'Overdue', color: '#ef4444', icon: AlertTriangle },
  cancelled: { label: 'Cancelled', color: '#9ca3af', icon: Clock },
};

type StatusFilter = 'all' | Invoice['status'];

export function InvoicesPanel() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [statusCounts, setStatusCounts] = useState<InvoiceStatusCounts>({
    all: 0,
    draft: 0,
    sent: 0,
    paid: 0,
    overdue: 0,
  });
  const [agingBuckets, setAgingBuckets] = useState<AgingBuckets>({
    current: 0,
    days30: 0,
    days60: 0,
    days90Plus: 0,
  });
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getInvoices();
      setInvoices(response.invoices || []);
      setStatusCounts(response.statusCounts || {
        all: 0,
        draft: 0,
        sent: 0,
        paid: 0,
        overdue: 0,
      });
      setAgingBuckets(response.agingBuckets || {
        current: 0,
        days30: 0,
        days60: 0,
        days90Plus: 0,
      });
      setTotalOutstanding(response.totalOutstanding || 0);
    } catch (err) {
      setError('Failed to load invoices');
      console.error('Invoices fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Filter invoices by status
  const filteredInvoices = useMemo(() => {
    let filtered = invoices;
    if (statusFilter !== 'all') {
      filtered = invoices.filter((inv) => inv.status === statusFilter);
    }
    // Sort by status priority (overdue first), then by amount (largest first)
    return [...filtered].sort((a, b) => {
      const statusOrder = { overdue: 0, sent: 1, viewed: 2, draft: 3, paid: 4, cancelled: 5 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      return b.balance - a.balance;
    });
  }, [invoices, statusFilter]);

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Receipt size={18} />
          <h2>Invoices</h2>
          <span className={styles.count}>{filteredInvoices.length}</span>
        </div>
        <div className={styles.headerRight}>
          {statusCounts.overdue > 0 && (
            <span className={styles.overdueBadge}>
              {statusCounts.overdue} Overdue
            </span>
          )}
          <button
            className={styles.refreshBtn}
            onClick={fetchInvoices}
            disabled={loading}
            title="Refresh invoices"
          >
            <RefreshCw size={16} className={loading ? styles.spinning : ''} />
          </button>
        </div>
      </div>

      {/* Outstanding Summary */}
      <div className={styles.summaryBar}>
        <div className={styles.totalOutstanding}>
          <span className={styles.label}>Total Outstanding</span>
          <span className={styles.amount}>{formatCurrency(totalOutstanding)}</span>
        </div>
        <div className={styles.agingBuckets}>
          <div className={styles.bucket}>
            <span className={styles.bucketLabel}>Current</span>
            <span className={styles.bucketValue}>{formatCurrency(agingBuckets.current)}</span>
          </div>
          <div className={cn(styles.bucket, agingBuckets.days30 > 0 && styles.warning)}>
            <span className={styles.bucketLabel}>30+ Days</span>
            <span className={styles.bucketValue}>{formatCurrency(agingBuckets.days30)}</span>
          </div>
          <div className={cn(styles.bucket, agingBuckets.days60 > 0 && styles.alert)}>
            <span className={styles.bucketLabel}>60+ Days</span>
            <span className={styles.bucketValue}>{formatCurrency(agingBuckets.days60)}</span>
          </div>
          <div className={cn(styles.bucket, agingBuckets.days90Plus > 0 && styles.critical)}>
            <span className={styles.bucketLabel}>90+ Days</span>
            <span className={styles.bucketValue}>{formatCurrency(agingBuckets.days90Plus)}</span>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className={styles.statusTabs}>
        <button
          className={cn(styles.statusTab, statusFilter === 'all' && styles.active)}
          onClick={() => setStatusFilter('all')}
        >
          All <span className={styles.tabCount}>{statusCounts.all}</span>
        </button>
        <button
          className={cn(styles.statusTab, statusFilter === 'overdue' && styles.active)}
          onClick={() => setStatusFilter('overdue')}
          style={{ '--status-color': statusConfig.overdue.color } as React.CSSProperties}
        >
          Overdue <span className={styles.tabCount}>{statusCounts.overdue}</span>
        </button>
        <button
          className={cn(styles.statusTab, statusFilter === 'sent' && styles.active)}
          onClick={() => setStatusFilter('sent')}
          style={{ '--status-color': statusConfig.sent.color } as React.CSSProperties}
        >
          Sent <span className={styles.tabCount}>{statusCounts.sent}</span>
        </button>
        <button
          className={cn(styles.statusTab, statusFilter === 'draft' && styles.active)}
          onClick={() => setStatusFilter('draft')}
          style={{ '--status-color': statusConfig.draft.color } as React.CSSProperties}
        >
          Draft <span className={styles.tabCount}>{statusCounts.draft}</span>
        </button>
        <button
          className={cn(styles.statusTab, statusFilter === 'paid' && styles.active)}
          onClick={() => setStatusFilter('paid')}
          style={{ '--status-color': statusConfig.paid.color } as React.CSSProperties}
        >
          Paid <span className={styles.tabCount}>{statusCounts.paid}</span>
        </button>
      </div>

      {/* Invoice List */}
      <div className={styles.invoiceList}>
        {loading ? (
          <div className={styles.loadingState}>Loading invoices...</div>
        ) : error ? (
          <div className={styles.errorState}>{error}</div>
        ) : filteredInvoices.length === 0 ? (
          <div className={styles.emptyState}>No invoices found</div>
        ) : (
          filteredInvoices.map((invoice) => {
            const StatusIcon = statusConfig[invoice.status]?.icon || FileText;
            return (
              <div
                key={invoice.id}
                className={cn(
                  styles.invoiceCard,
                  invoice.status === 'overdue' && styles.overdue
                )}
              >
                <div
                  className={styles.invoiceHeader}
                  onClick={() => toggleExpanded(invoice.id)}
                >
                  <div className={styles.invoiceMain}>
                    <div className={styles.invoiceTitle}>
                      <span className={styles.invoiceNumber}>{invoice.invoiceNumber}</span>
                      <span
                        className={styles.statusBadge}
                        style={{ backgroundColor: statusConfig[invoice.status].color }}
                      >
                        <StatusIcon size={12} />
                        {statusConfig[invoice.status].label}
                      </span>
                    </div>
                    <div className={styles.invoiceMeta}>
                      <span className={styles.customer}>
                        <User size={12} />
                        {invoice.customer}
                      </span>
                      {invoice.project && (
                        <span className={styles.project}>
                          {invoice.project}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.invoiceRight}>
                    <div className={styles.amounts}>
                      <span className={styles.total}>{formatCurrency(invoice.total)}</span>
                      {invoice.balance > 0 && invoice.balance !== invoice.total && (
                        <span className={styles.balance}>
                          Due: {formatCurrency(invoice.balance)}
                        </span>
                      )}
                    </div>
                    {invoice.daysPastDue && invoice.daysPastDue > 0 && (
                      <span className={styles.pastDue}>
                        <AlertTriangle size={12} />
                        {invoice.daysPastDue} days past due
                      </span>
                    )}
                    <button className={styles.expandBtn}>
                      {expandedId === invoice.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === invoice.id && (
                  <div className={styles.invoiceDetails}>
                    <div className={styles.detailsGrid}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Subtotal</span>
                        <span className={styles.detailValue}>{formatCurrency(invoice.subtotal)}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Tax</span>
                        <span className={styles.detailValue}>{formatCurrency(invoice.tax)}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Total</span>
                        <span className={styles.detailValue}>{formatCurrency(invoice.total)}</span>
                      </div>
                      {invoice.dueDate && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Due Date</span>
                          <span className={styles.detailValue}>{formatDate(invoice.dueDate)}</span>
                        </div>
                      )}
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Created</span>
                        <span className={styles.detailValue}>{formatRelativeTime(invoice.createdAt)}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Line Items</span>
                        <span className={styles.detailValue}>{invoice.lineItemCount}</span>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className={styles.quickActions}>
                      {invoice.status === 'draft' && (
                        <button className={cn(styles.actionBtn, styles.primary)}>
                          <Send size={14} />
                          Send Invoice
                        </button>
                      )}
                      {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                        <>
                          <button className={styles.actionBtn}>
                            <Mail size={14} />
                            Send Reminder
                          </button>
                          <button className={cn(styles.actionBtn, styles.primary)}>
                            <DollarSign size={14} />
                            Record Payment
                          </button>
                        </>
                      )}
                      <button className={styles.actionBtn}>
                        <FileText size={14} />
                        View Details
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

export default InvoicesPanel;
