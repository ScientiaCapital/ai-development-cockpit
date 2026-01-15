'use client';

import { useState, useEffect } from 'react';
import {
  Zap,
  Phone,
  Truck,
  DollarSign,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  Settings,
  HelpCircle,
  Flame,
  Droplets,
  Sun,
  Wrench,
  AlertTriangle,
  ClipboardList,
  UserPlus,
  MessageSquare,
  Wifi,
  Home,
  Shield,
  Camera,
  HardDrive,
  Building2,
} from 'lucide-react';
import { cn, getStatusColor } from '@/lib/utils';
import { getAgents, getDashboardStats } from '@/lib/api';
import { InstanceSelector } from '@/components/InstanceSelector';
import type { Agent, DashboardStats, QuickAction, TradeName } from '@/types';
import styles from './Sidebar.module.css';

// Team definitions - Energy+MEP, Roofing, Low Voltage, Fire & Safety
type TeamId = 'HVAC' | 'Plumbing' | 'Electrical' | 'Solar' | 'Low Voltage' | 'Fire & Safety' | 'Roofing';

const TEAMS: { id: TeamId; label: string; icon: React.ElementType; color: string; description: string }[] = [
  { id: 'HVAC', label: 'HVAC', icon: Flame, color: '#ef4444', description: 'Heating, Cooling, Ventilation' },
  { id: 'Plumbing', label: 'Plumb', icon: Droplets, color: '#3b82f6', description: 'Pipes, Drains, Water Heaters' },
  { id: 'Electrical', label: 'Elec', icon: Zap, color: '#f59e0b', description: 'Power, Panels, Circuits' },
  { id: 'Solar', label: 'Solar', icon: Sun, color: '#22c55e', description: 'PV, Battery, EV Chargers' },
  { id: 'Low Voltage', label: 'LV', icon: Wifi, color: '#8b5cf6', description: 'Data, Telecom, Security, AV' },
  { id: 'Fire & Safety', label: 'Fire', icon: AlertTriangle, color: '#dc2626', description: 'Sprinkler, Alarms, Extinguishers' },
  { id: 'Roofing', label: 'Roof', icon: Home, color: '#78716c', description: 'Commercial & Residential Roofing' },
];

// Team-specific agents - optimized for small crews handling big C&I/Industrial jobs
const teamAgents: Record<TeamId | 'all', Agent[]> = {
  'all': [
    { id: 'dispatch', name: 'Smart Dispatch', icon: 'Truck', color: '#22c55e', status: 'online', activeTasks: 0, description: 'Routes work orders to technicians' },
    { id: 'voice-ai', name: 'Voice AI', icon: 'Phone', color: '#3b82f6', status: 'online', activeTasks: 0, description: 'Handles inbound/outbound calls' },
    { id: 'vision-ai', name: 'Vision Inspector', icon: 'Camera', color: '#8b5cf6', status: 'online', activeTasks: 0, description: 'Photo analysis & equipment ID' },
  ],
  'HVAC': [
    { id: 'hvac-tech', name: 'HVAC Technician', icon: 'Wrench', color: '#ef4444', status: 'online', activeTasks: 3, description: 'Equipment diagnostics & repair guidance' },
    { id: 'hvac-load', name: 'Load Calculator', icon: 'FileText', color: '#ef4444', status: 'online', activeTasks: 0, description: 'Manual J load calculations' },
  ],
  'Plumbing': [
    { id: 'plumb-tech', name: 'Plumbing Pro', icon: 'Droplets', color: '#3b82f6', status: 'online', activeTasks: 1, description: 'Drain & pipe diagnostics' },
    { id: 'backflow', name: 'Backflow Tester', icon: 'ClipboardList', color: '#3b82f6', status: 'online', activeTasks: 0, description: 'Backflow test reports & compliance' },
  ],
  'Electrical': [
    { id: 'elec-expert', name: 'Electrical Expert', icon: 'Zap', color: '#f59e0b', status: 'online', activeTasks: 2, description: 'NEC code lookup & panel analysis' },
    { id: 'elec-calc', name: 'Service Sizer', icon: 'FileText', color: '#f59e0b', status: 'online', activeTasks: 0, description: 'Service size & load calculations' },
  ],
  'Solar': [
    { id: 'solar-design', name: 'Solar Designer', icon: 'Sun', color: '#22c55e', status: 'online', activeTasks: 1, description: 'System sizing & ROI analysis' },
    { id: 'solar-commission', name: 'Commissioning', icon: 'ClipboardList', color: '#22c55e', status: 'online', activeTasks: 0, description: 'Interconnection & PTO support' },
  ],
  'Low Voltage': [
    { id: 'lv-tech', name: 'LV Technician', icon: 'Wifi', color: '#8b5cf6', status: 'online', activeTasks: 2, description: 'Data, telecom, security systems' },
    { id: 'lv-design', name: 'System Designer', icon: 'HardDrive', color: '#8b5cf6', status: 'online', activeTasks: 0, description: 'Network & AV system design' },
    { id: 'lv-security', name: 'Security Expert', icon: 'Shield', color: '#8b5cf6', status: 'online', activeTasks: 1, description: 'Access control & surveillance' },
  ],
  'Fire & Safety': [
    { id: 'fire-inspect', name: 'Fire Inspector', icon: 'AlertTriangle', color: '#dc2626', status: 'online', activeTasks: 2, description: 'NFPA compliance & inspections' },
    { id: 'sprinkler', name: 'Sprinkler Tech', icon: 'Droplets', color: '#dc2626', status: 'online', activeTasks: 1, description: 'Sprinkler system maintenance' },
    { id: 'fire-signoff', name: 'Sign-Off Assistant', icon: 'ClipboardList', color: '#dc2626', status: 'online', activeTasks: 0, description: 'C&I job sign-off documentation' },
  ],
  'Roofing': [
    { id: 'roof-inspect', name: 'Roof Inspector', icon: 'Home', color: '#78716c', status: 'online', activeTasks: 1, description: 'Roof condition assessment' },
    { id: 'roof-estimate', name: 'Estimator', icon: 'DollarSign', color: '#78716c', status: 'online', activeTasks: 0, description: 'Material takeoffs & estimates' },
    { id: 'roof-commercial', name: 'Commercial Spec', icon: 'Building2', color: '#78716c', status: 'online', activeTasks: 0, description: 'C&I roofing specifications' },
  ],
};

// Team-specific quick actions - asset-centric for self-performing contractors
const teamQuickActions: Record<TeamId | 'all', QuickAction[]> = {
  'all': [
    { id: 'new-wo', icon: 'FileText', label: 'New Work Order', query: 'Create a new work order' },
    { id: 'dispatch', icon: 'Truck', label: 'Dispatch Tech', query: 'Dispatch a technician to a job' },
    { id: 'emergency', icon: 'Phone', label: '🚨 Emergency', query: 'I have an emergency service call' },
    { id: 'asset-lookup', icon: 'Camera', label: 'ID Asset', query: 'Identify this equipment from photo' },
  ],
  'HVAC': [
    { id: 'heat-pump', icon: 'Flame', label: 'Heat Pump', query: 'Diagnose heat pump issue' },
    { id: 'tstat', icon: 'Thermometer', label: 'Thermostat', query: 'Smart thermostat troubleshooting' },
    { id: 'ventilation', icon: 'Wind', label: 'Ventilation', query: 'Ventilation system service' },
    { id: 'hvac-pm', icon: 'Calendar', label: 'Schedule PM', query: 'Schedule preventive maintenance' },
  ],
  'Plumbing': [
    { id: 'water-heater', icon: 'Flame', label: 'Water Heater', query: 'Water heater service' },
    { id: 'backflow', icon: 'ClipboardList', label: 'Backflow Test', query: 'Create backflow test report' },
    { id: 'camera', icon: 'Camera', label: 'Camera Inspect', query: 'Start camera inspection report' },
    { id: 'tankless', icon: 'Droplets', label: 'Tankless', query: 'Tankless water heater service' },
  ],
  'Electrical': [
    { id: 'smart-panel', icon: 'Zap', label: 'Smart Panel', query: 'Smart panel (Span/Lumin) service' },
    { id: 'ev-charger', icon: 'Zap', label: 'EV Charger', query: 'EV charger installation or service' },
    { id: 'generator', icon: 'Zap', label: 'Generator', query: 'Generator maintenance or install' },
    { id: 'panel-upgrade', icon: 'ClipboardList', label: 'Panel Upgrade', query: 'Electrical panel upgrade' },
  ],
  'Solar': [
    { id: 'micros', icon: 'Sun', label: 'Microinverters', query: 'Microinverter troubleshooting' },
    { id: 'battery', icon: 'Battery', label: 'Battery', query: 'Battery storage system service' },
    { id: 'commission', icon: 'ClipboardList', label: 'Commission', query: 'Solar system commissioning' },
    { id: 'monitoring', icon: 'Activity', label: 'Monitoring', query: 'Check system performance' },
  ],
  'Low Voltage': [
    { id: 'network', icon: 'Wifi', label: 'Network', query: 'Network infrastructure service' },
    { id: 'access-ctrl', icon: 'Shield', label: 'Access Control', query: 'Access control system service' },
    { id: 'cameras', icon: 'Camera', label: 'Surveillance', query: 'Security camera installation' },
    { id: 'av-system', icon: 'HardDrive', label: 'AV System', query: 'Audio/video system service' },
  ],
  'Fire & Safety': [
    { id: 'sprinkler', icon: 'Droplets', label: 'Sprinkler', query: 'Sprinkler system inspection' },
    { id: 'fire-alarm', icon: 'AlertTriangle', label: 'Fire Alarm', query: 'Fire alarm system test' },
    { id: 'extinguisher', icon: 'FileText', label: 'Extinguisher', query: 'Fire extinguisher inspection' },
    { id: 'ci-signoff', icon: 'ClipboardList', label: 'C&I Sign-Off', query: 'Commercial job sign-off checklist' },
  ],
  'Roofing': [
    { id: 'inspect', icon: 'Home', label: 'Inspection', query: 'Roof condition inspection' },
    { id: 'estimate', icon: 'DollarSign', label: 'Estimate', query: 'Create roofing estimate' },
    { id: 'commercial', icon: 'Building2', label: 'Commercial', query: 'Commercial roofing specs' },
    { id: 'warranty', icon: 'ClipboardList', label: 'Warranty', query: 'Warranty claim documentation' },
  ],
};

// Asset types for quick asset selection
const ASSET_TYPES = [
  { id: 'heat-pump', label: 'Heat Pump', icon: Flame, team: 'HVAC' },
  { id: 'tstat', label: 'Thermostat', icon: Flame, team: 'HVAC' },
  { id: 'rtu', label: 'RTU', icon: Flame, team: 'HVAC' },
  { id: 'smart-panel', label: 'Smart Panel', icon: Zap, team: 'Electrical' },
  { id: 'ev-charger', label: 'EV Charger', icon: Zap, team: 'Electrical' },
  { id: 'generator', label: 'Generator', icon: Zap, team: 'Electrical' },
  { id: 'microinverter', label: 'Microinverters', icon: Sun, team: 'Solar' },
  { id: 'battery', label: 'Battery', icon: Sun, team: 'Solar' },
  { id: 'water-heater', label: 'Water Heater', icon: Droplets, team: 'Plumbing' },
  { id: 'backflow', label: 'Backflow Device', icon: Droplets, team: 'Plumbing' },
];

const iconMap: Record<string, React.ElementType> = {
  Phone,
  Truck,
  DollarSign,
  Calendar,
  FileText,
  Zap,
  Wrench,
  Droplets,
  Sun,
  AlertTriangle,
  ClipboardList,
  UserPlus,
  Camera,
  Wifi,
  Home,
  Shield,
  HardDrive,
  Building2,
  Flame,
  Battery: Zap,
  Activity: Zap,
  Wind: Flame,
  Thermometer: Flame,
};

interface SidebarProps {
  onQuickAction?: (query: string) => void;
  onSelectAgent?: (agent: Agent) => void;
  selectedAgent?: Agent | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  onQuickAction,
  onSelectAgent,
  selectedAgent,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const [selectedTeam, setSelectedTeam] = useState<TeamId | 'all'>('all');
  const [stats, setStats] = useState<DashboardStats>({
    // Operational
    openWorkOrders: 0,
    scheduledToday: 0,
    completedToday: 0,
    completedThisWeek: 0,
    // Financial
    revenueToday: 0,
    revenueThisWeek: 0,
    revenueThisMonth: 0,
    arOver30Days: 0,
    // Efficiency
    firstTimeFixRate: 85,
    avgResponseTime: 2.4,
    techUtilization: 78,
    // Pipeline
    activeProjects: 0,
    pendingEstimates: 0,
    openServiceCalls: 0,
    // Inventory
    catalogItemCount: 0,
    lowStockItems: 0,
    activeCalls: 0,
  });

  useEffect(() => {
    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      }
    };

    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Zap;
  };

  // Get agents for current team selection
  const currentAgents = [
    ...teamAgents['all'],
    ...(selectedTeam !== 'all' ? teamAgents[selectedTeam] : []),
  ];

  // Get quick actions for current team
  const currentQuickActions = selectedTeam === 'all'
    ? teamQuickActions['all']
    : teamQuickActions[selectedTeam];

  const handleAgentClick = (agent: Agent) => {
    onSelectAgent?.(agent);
  };

  return (
    <aside className={cn(styles.sidebar, collapsed && styles.collapsed)}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <Zap size={24} />
        </div>
        {!collapsed && (
          <div className={styles.logoText}>
            <h1>Kipper Energy</h1>
            <span>Multi-Trade AI</span>
          </div>
        )}
        <button
          className={styles.collapseBtn}
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Instance Selector - Switch between Coperniq instances */}
      {!collapsed && (
        <div className={styles.instanceSelector}>
          <InstanceSelector />
        </div>
      )}

      {/* Team Tabs - Energy+MEP, Low Voltage, Fire & Safety, Roofing */}
      {!collapsed && (
        <div className={styles.tradeTabs}>
          <button
            className={cn(styles.tradeTab, selectedTeam === 'all' && styles.active)}
            onClick={() => setSelectedTeam('all')}
            title="All Teams"
          >
            All
          </button>
          {TEAMS.map((team) => {
            const TeamIcon = team.icon;
            return (
              <button
                key={team.id}
                className={cn(styles.tradeTab, selectedTeam === team.id && styles.active)}
                onClick={() => setSelectedTeam(team.id)}
                title={team.description}
                style={{ '--trade-color': team.color } as React.CSSProperties}
              >
                <TeamIcon size={14} />
              </button>
            );
          })}
        </div>
      )}

      {/* Team Header (when team selected) */}
      {!collapsed && selectedTeam !== 'all' && (
        <div
          className={styles.tradeHeader}
          style={{ '--trade-color': TEAMS.find(t => t.id === selectedTeam)?.color } as React.CSSProperties}
        >
          {(() => {
            const team = TEAMS.find(t => t.id === selectedTeam);
            const TeamIcon = team?.icon || Zap;
            return (
              <>
                <TeamIcon size={18} />
                <span>{selectedTeam}</span>
              </>
            );
          })()}
        </div>
      )}

      {/* AI Agents - Now Clickable */}
      <div className={styles.section}>
        {!collapsed && <div className={styles.sectionTitle}>AI Agents</div>}
        <div className={styles.agentsList}>
          {currentAgents.map((agent) => {
            const IconComponent = getIcon(agent.icon);
            const isSelected = selectedAgent?.id === agent.id;
            return (
              <button
                key={agent.id}
                className={cn(
                  styles.agentItem,
                  styles.clickable,
                  isSelected && styles.selected
                )}
                onClick={() => handleAgentClick(agent)}
                title={collapsed ? agent.name : agent.description}
              >
                <div className={styles.agentInfo}>
                  <div
                    className={styles.agentIcon}
                    style={{ background: agent.color }}
                  >
                    <IconComponent size={16} />
                  </div>
                  {!collapsed && (
                    <div className={styles.agentDetails}>
                      <span className={styles.agentName}>{agent.name}</span>
                      {agent.activeTasks > 0 && (
                        <span className={styles.agentTasks}>
                          {agent.activeTasks} active
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className={styles.agentRight}>
                  {isSelected && !collapsed && (
                    <MessageSquare size={14} className={styles.chatIndicator} />
                  )}
                  {/* Green dot only shows for selected agent */}
                  {isSelected && (
                    <div
                      className={styles.statusDot}
                      style={{ background: '#22c55e' }}
                      title="Active"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Actions - Team & Asset Specific */}
      {!collapsed && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            Quick Actions
            {selectedTeam !== 'all' && (
              <span className={styles.tradeBadge} style={{ background: TEAMS.find(t => t.id === selectedTeam)?.color }}>
                {selectedTeam}
              </span>
            )}
          </div>
          <div className={styles.quickActions}>
            {currentQuickActions.map((action) => {
              const IconComponent = getIcon(action.icon);
              return (
                <button
                  key={action.id}
                  className={styles.actionBtn}
                  onClick={() => onQuickAction?.(action.query)}
                >
                  <IconComponent size={16} />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Dashboard - 4 Key Metrics for C&I Contractors */}
      <div className={cn(styles.section, styles.statsSection)}>
        {!collapsed && <div className={styles.sectionTitle}>Today</div>}
        <div className={cn(styles.statsGrid, collapsed && styles.statsCollapsed)}>
          <div className={styles.statCard} title="Open Work Orders">
            <div className={styles.statValue}>{stats.openWorkOrders}</div>
            {!collapsed && <div className={styles.statLabel}>Open WOs</div>}
          </div>
          <div className={styles.statCard} title="Active Projects">
            <div className={styles.statValue}>{stats.activeProjects}</div>
            {!collapsed && <div className={styles.statLabel}>Projects</div>}
          </div>
          {!collapsed && (
            <>
              <div className={styles.statCard} title="Revenue This Week">
                <div className={styles.statValue}>
                  ${stats.revenueThisWeek >= 1000
                    ? `${(stats.revenueThisWeek / 1000).toFixed(0)}k`
                    : stats.revenueThisWeek}
                </div>
                <div className={styles.statLabel}>Rev/Week</div>
              </div>
              <div className={styles.statCard} title="First-Time Fix Rate">
                <div className={cn(styles.statValue, stats.firstTimeFixRate >= 80 ? styles.statGood : styles.statWarn)}>
                  {stats.firstTimeFixRate}%
                </div>
                <div className={styles.statLabel}>FTF Rate</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className={styles.footer}>
        <button className={styles.footerBtn} title="Settings">
          <Settings size={18} />
          {!collapsed && <span>Settings</span>}
        </button>
        <button className={styles.footerBtn} title="Help">
          <HelpCircle size={18} />
          {!collapsed && <span>Help</span>}
        </button>
      </div>
    </aside>
  );
}
