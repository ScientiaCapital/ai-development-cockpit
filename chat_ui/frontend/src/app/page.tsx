'use client';

import { useState, useCallback } from 'react';
import { Menu, X, Phone, FileText } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { ChatInterface } from '@/components/Chat';
import { WorkOrdersPanel } from '@/components/WorkOrders';
import { VoiceAIPanel } from '@/components/VoiceAI';
import { cn } from '@/lib/utils';
import type { Agent } from '@/types';
import styles from './page.module.css';

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelView, setRightPanelView] = useState<'workorders' | 'voiceai' | null>('workorders');
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

  const toggleRightPanel = useCallback((view: 'workorders' | 'voiceai') => {
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

      {/* Right Panel - Work Orders */}
      {rightPanelView === 'workorders' && (
        <div className={styles.rightPanel}>
          <WorkOrdersPanel />
        </div>
      )}
    </div>
  );
}
