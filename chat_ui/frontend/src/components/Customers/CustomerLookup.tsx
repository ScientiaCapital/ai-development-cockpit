'use client';

/**
 * CustomerLookup Panel
 *
 * Displays searchable customer list from Coperniq /clients endpoint.
 * Features: search, status filtering, customer details expansion.
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, Phone, Mail, MapPin, Building2, User, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { getCustomers, Customer } from '@/lib/api';
import styles from './CustomerLookup.module.css';

// Format relative time for display
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Status badge colors
function getStatusColor(status: Customer['status']): string {
  switch (status) {
    case 'active': return '#22c55e';
    case 'lead': return '#f59e0b';
    case 'inactive': return '#6b7280';
    default: return '#6b7280';
  }
}

export function CustomerLookup() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'lead' | 'inactive'>('all');

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCustomers();
      setCustomers(response.customers || []);
    } catch (err) {
      setError('Failed to load customers');
      console.error('Customer fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Filter customers by search and status
  const filteredCustomers = customers.filter((customer) => {
    // Search filter
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query ||
      customer.name.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.phone?.includes(query) ||
      customer.companyName?.toLowerCase().includes(query) ||
      customer.address?.toLowerCase().includes(query);

    // Status filter
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Count by status
  const statusCounts = {
    all: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    lead: customers.filter(c => c.status === 'lead').length,
    inactive: customers.filter(c => c.status === 'inactive').length,
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <User size={18} />
          <h2>Customer Lookup</h2>
          <span className={styles.count}>{filteredCustomers.length}</span>
        </div>
        <button
          className={styles.refreshBtn}
          onClick={fetchCustomers}
          disabled={loading}
          title="Refresh customers"
        >
          <RefreshCw size={16} className={loading ? styles.spinning : ''} />
        </button>
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search by name, email, phone, company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Status Filter Tabs */}
      <div className={styles.statusTabs}>
        <button
          className={`${styles.statusTab} ${statusFilter === 'all' ? styles.active : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          All <span className={styles.tabCount}>{statusCounts.all}</span>
        </button>
        <button
          className={`${styles.statusTab} ${statusFilter === 'active' ? styles.active : ''}`}
          onClick={() => setStatusFilter('active')}
          style={{ '--status-color': '#22c55e' } as React.CSSProperties}
        >
          Active <span className={styles.tabCount}>{statusCounts.active}</span>
        </button>
        <button
          className={`${styles.statusTab} ${statusFilter === 'lead' ? styles.active : ''}`}
          onClick={() => setStatusFilter('lead')}
          style={{ '--status-color': '#f59e0b' } as React.CSSProperties}
        >
          Leads <span className={styles.tabCount}>{statusCounts.lead}</span>
        </button>
        <button
          className={`${styles.statusTab} ${statusFilter === 'inactive' ? styles.active : ''}`}
          onClick={() => setStatusFilter('inactive')}
          style={{ '--status-color': '#6b7280' } as React.CSSProperties}
        >
          Inactive <span className={styles.tabCount}>{statusCounts.inactive}</span>
        </button>
      </div>

      {/* Customer List */}
      <div className={styles.customerList}>
        {loading ? (
          <div className={styles.loadingState}>Loading customers...</div>
        ) : error ? (
          <div className={styles.errorState}>{error}</div>
        ) : filteredCustomers.length === 0 ? (
          <div className={styles.emptyState}>
            {searchQuery ? 'No customers match your search' : 'No customers found'}
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div key={customer.id} className={styles.customerCard}>
              <div
                className={styles.customerHeader}
                onClick={() => toggleExpanded(customer.id)}
              >
                <div className={styles.customerMain}>
                  <div className={styles.customerName}>
                    {customer.companyName ? (
                      <Building2 size={16} className={styles.typeIcon} />
                    ) : (
                      <User size={16} className={styles.typeIcon} />
                    )}
                    <span>{customer.name}</span>
                    {customer.companyName && (
                      <span className={styles.companyName}>{customer.companyName}</span>
                    )}
                  </div>
                  <div className={styles.customerMeta}>
                    <span
                      className={styles.statusBadge}
                      style={{ backgroundColor: getStatusColor(customer.status) }}
                    >
                      {customer.status}
                    </span>
                    <span className={styles.createdAt}>
                      Customer since {formatRelativeTime(customer.createdAt)}
                    </span>
                  </div>
                </div>
                <button className={styles.expandBtn}>
                  {expandedId === customer.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>

              {/* Expanded Details */}
              {expandedId === customer.id && (
                <div className={styles.customerDetails}>
                  {customer.phone && (
                    <div className={styles.detailRow}>
                      <Phone size={14} />
                      <a href={`tel:${customer.phone}`} className={styles.detailLink}>
                        {customer.phone}
                      </a>
                    </div>
                  )}
                  {customer.email && (
                    <div className={styles.detailRow}>
                      <Mail size={14} />
                      <a href={`mailto:${customer.email}`} className={styles.detailLink}>
                        {customer.email}
                      </a>
                    </div>
                  )}
                  {customer.address && (
                    <div className={styles.detailRow}>
                      <MapPin size={14} />
                      <span>{customer.address}</span>
                    </div>
                  )}

                  {/* Stats Row */}
                  <div className={styles.statsRow}>
                    {customer.projectCount !== undefined && (
                      <div className={styles.statItem}>
                        <span className={styles.statValue}>{customer.projectCount}</span>
                        <span className={styles.statLabel}>Projects</span>
                      </div>
                    )}
                    {customer.totalRevenue !== undefined && customer.totalRevenue > 0 && (
                      <div className={styles.statItem}>
                        <span className={styles.statValue}>{formatCurrency(customer.totalRevenue)}</span>
                        <span className={styles.statLabel}>Total Revenue</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className={styles.quickActions}>
                    {customer.phone && (
                      <a href={`tel:${customer.phone}`} className={styles.actionBtn} title="Call">
                        <Phone size={14} /> Call
                      </a>
                    )}
                    {customer.email && (
                      <a href={`mailto:${customer.email}`} className={styles.actionBtn} title="Email">
                        <Mail size={14} /> Email
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CustomerLookup;
