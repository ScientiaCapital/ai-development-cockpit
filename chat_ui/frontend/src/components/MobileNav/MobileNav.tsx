'use client';

import { useState } from 'react';
import {
  MessageSquare,
  FileText,
  Phone,
  User,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import styles from './MobileNav.module.css';

interface MobileNavProps {
  activeTab: 'chat' | 'workorders' | 'voiceai' | 'profile';
  onTabChange: (tab: 'chat' | 'workorders' | 'voiceai' | 'profile') => void;
  onMenuClick?: () => void;
  voiceAIBadge?: number;
  workOrdersBadge?: number;
}

const tabs = [
  { id: 'chat' as const, icon: MessageSquare, label: 'Chat' },
  { id: 'workorders' as const, icon: FileText, label: 'Work Orders' },
  { id: 'voiceai' as const, icon: Phone, label: 'Voice AI' },
  { id: 'profile' as const, icon: User, label: 'Profile' },
];

export default function MobileNav({
  activeTab,
  onTabChange,
  onMenuClick,
  voiceAIBadge,
  workOrdersBadge,
}: MobileNavProps) {
  const getBadge = (tabId: string): number | undefined => {
    if (tabId === 'voiceai') return voiceAIBadge;
    if (tabId === 'workorders') return workOrdersBadge;
    return undefined;
  };

  return (
    <nav className={styles.nav}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const badge = getBadge(tab.id);

        return (
          <button
            key={tab.id}
            className={cn(styles.navItem, activeTab === tab.id && styles.active)}
            onClick={() => onTabChange(tab.id)}
            aria-label={tab.label}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <div className={styles.iconWrapper}>
              <Icon size={22} />
              {badge !== undefined && badge > 0 && (
                <span className={styles.badge}>{badge}</span>
              )}
            </div>
            <span className={styles.label}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
