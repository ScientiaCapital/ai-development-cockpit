'use client';

import { useState, useCallback } from 'react';
import { Menu, X, Phone, FileText, Users, FolderKanban, Inbox, Receipt } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { ChatInterface } from '@/components/Chat';
import { WorkOrdersPanel } from '@/components/WorkOrders';
import { CustomerLookup } from '@/components/Customers/CustomerLookup';
import { ProjectsPanel } from '@/components/Projects/ProjectsPanel';
import { RequestsPanel } from '@/components/Requests/RequestsPanel';
import { SchedulePanel } from '@/components/Schedule';
import { InvoicesPanel } from '@/components/Invoices';
import { VoiceAIPanel } from '@/components/VoiceAI';
import { cn } from '@/lib/utils';
import type { Agent } from '@/types';
import styles from './page.module.css';

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelView, setRightPanelView] = useState<'workorders' | 'schedule' | 'customers' | 'projects' | 'requests' | 'invoices' | 'voiceai' | null>('schedule');
  const [quickActionMessage, setQuickActionMessage] = useState<string | undefined>();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const handleQuickAction = useCallback((query: string) => {
    setQuickActionMessage(query);
    // Clear the message after it's been consumed
    setTimeout(() => setQuickActionMessage(undefined), 100);
  }, []);

  const handleSelectAgent = useCallback((agent: Agent) => {
    setSelectedAgent(agent);
    // Send initial greeting when selecting agent
    setQuickActionMessage(`I'd like to work with ${agent.name}. ${agent.description}`);
    setTimeout(() => setQuickActionMessage(undefined), 100);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const toggleRightPanel = useCallback((view: 'workorders' | 'schedule' | 'customers' | 'projects' | 'requests' | 'invoices' | 'voiceai') => {
    setRightPanelView((prev) => (prev === view ? null : view));
  }, []);

  return (
    <div className={styles.layout}>
      {/* Mobile Header */}
      <header className={styles.mobileHeader}>
        <button
          className={styles.menuBtn}
          onClick={toggleMobileSidebar}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className={styles.mobileTitle}>
          <span className={styles.logoIcon}>K</span>
          <span>Kipper Energy AI</span>
        </div>
        <div className={styles.mobileActions}>
          <button
            className={cn(styles.panelToggle, rightPanelView === 'voiceai' && styles.active)}
            onClick={() => toggleRightPanel('voiceai')}
            aria-label="Voice AI"
          >
            <Phone size={20} />
          </button>
          <button
            className={cn(styles.panelToggle, rightPanelView === 'customers' && styles.active)}
            onClick={() => toggleRightPanel('customers')}
            aria-label="Customers"
          >
            <Users size={20} />
          </button>
          <button
            className={cn(styles.panelToggle, rightPanelView === 'workorders' && styles.active)}
            onClick={() => toggleRightPanel('workorders')}
            aria-label="Work Orders"
          >
            <FileText size={20} />
          </button>
        </div>
      </header>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div className={cn(styles.sidebarWrapper, sidebarOpen && styles.open)}>
        <Sidebar
          onQuickAction={handleQuickAction}
          onSelectAgent={handleSelectAgent}
          selectedAgent={selectedAgent}
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />
      </div>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Voice AI Panel (Floating) */}
        <div className={styles.voiceAIFloating}>
          <VoiceAIPanel collapsed={rightPanelView !== 'voiceai'} onToggle={() => toggleRightPanel('voiceai')} />
        </div>

        {/* Chat Interface */}
        <ChatInterface
          initialMessage={quickActionMessage}
          onClear={() => {}}
        />
      </main>

      {/* Right Panel Container */}
      {(rightPanelView === 'workorders' || rightPanelView === 'schedule' || rightPanelView === 'customers' || rightPanelView === 'projects' || rightPanelView === 'requests' || rightPanelView === 'invoices') && (
        <div className={styles.rightPanelContainer}>
          {/* Panel Tabs */}
          <div className={styles.panelTabs}>
            <button
              className={cn(styles.panelTabBtn, rightPanelView === 'schedule' && styles.activeTab)}
              onClick={() => setRightPanelView('schedule')}
            >
              <FileText size={16} />
              <span>Schedule</span>
            </button>
            <button
              className={cn(styles.panelTabBtn, rightPanelView === 'requests' && styles.activeTab)}
              onClick={() => setRightPanelView('requests')}
            >
              <Inbox size={16} />
              <span>Requests</span>
            </button>
            <button
              className={cn(styles.panelTabBtn, rightPanelView === 'customers' && styles.activeTab)}
              onClick={() => setRightPanelView('customers')}
            >
              <Users size={16} />
              <span>Customers</span>
            </button>
            <button
              className={cn(styles.panelTabBtn, rightPanelView === 'projects' && styles.activeTab)}
              onClick={() => setRightPanelView('projects')}
            >
              <FolderKanban size={16} />
              <span>Projects</span>
            </button>
            <button
              className={cn(styles.panelTabBtn, rightPanelView === 'invoices' && styles.activeTab)}
              onClick={() => setRightPanelView('invoices')}
            >
              <Receipt size={16} />
              <span>Invoices</span>
            </button>
          </div>

          {/* Panel Content */}
          <div className={styles.rightPanel}>
            {rightPanelView === 'schedule' && <SchedulePanel />}
            {rightPanelView === 'workorders' && <WorkOrdersPanel />}
            {rightPanelView === 'requests' && <RequestsPanel />}
            {rightPanelView === 'customers' && <CustomerLookup />}
            {rightPanelView === 'projects' && <ProjectsPanel />}
            {rightPanelView === 'invoices' && <InvoicesPanel />}
          </div>
        </div>
      )}
    </div>
  );
}
