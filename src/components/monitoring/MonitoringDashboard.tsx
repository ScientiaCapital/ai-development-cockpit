/**
 * Organization-Specific Monitoring Dashboard Component
 * Provides comprehensive monitoring visualization tailored to each organization
 */

'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Activity, DollarSign, Users, Server, Zap } from 'lucide-react';
import { Organization } from '@/services/monitoring/prometheus.service';
import { useMonitoring } from '@/hooks/useMonitoring';
import { cn } from '@/lib/utils';

export interface MonitoringDashboardProps {
  organization: Organization;
  className?: string;
}

export function MonitoringDashboard({ organization, className }: MonitoringDashboardProps) {
  const {
    dashboardData,
    systemHealth,
    alerts,
    alertSummary,
    loading,
    error,
    lastUpdated,
    isRealTimeActive,
  } = useMonitoring({
    organization,
    refreshInterval: 30000,
    enableRealTime: true,
  });

  // Organization-specific styling
  const organizationTheme = useMemo(() => {
    switch (organization) {
      case 'arcade':
        return {
          primaryColor: 'text-green-400',
          accentColor: 'bg-green-500/10 border-green-500/20',
          cardStyle: 'bg-gray-900/50 border-green-500/20',
          badgeStyle: 'bg-green-500/20 text-green-400',
          prefix: '🚀 COCKPIT',
        };
      case 'enterprise':
        return {
          primaryColor: 'text-blue-600',
          accentColor: 'bg-blue-500/10 border-blue-500/20',
          cardStyle: 'bg-white border-blue-200',
          badgeStyle: 'bg-blue-100 text-blue-700',
          prefix: '📊 SCIENTIA',
        };
      default:
        return {
          primaryColor: 'text-purple-600',
          accentColor: 'bg-purple-500/10 border-purple-500/20',
          cardStyle: 'bg-gray-50 border-purple-200',
          badgeStyle: 'bg-purple-100 text-purple-700',
          prefix: '⚡ SHARED',
        };
    }
  }, [organization]);

  if (error) {
    return (
      <div className={cn('p-6', className)}>
        <Card className={cn('border-red-200', organizationTheme.cardStyle)}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Monitoring Error</span>
            </div>
            <p className="text-sm text-red-500 mt-2">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading && !dashboardData) {
    return (
      <div className={cn('p-6', className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className={organizationTheme.cardStyle}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn('text-3xl font-bold', organizationTheme.primaryColor)}>
            {organizationTheme.prefix} Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time monitoring and analytics
            {lastUpdated && (
              <span className="ml-2 text-sm">
                • Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            variant={isRealTimeActive ? 'default' : 'secondary'}
            className={organizationTheme.badgeStyle}
          >
            {isRealTimeActive ? 'Live' : 'Paused'}
          </Badge>
          {systemHealth && (
            <Badge
              variant={systemHealth.overall === 'healthy' ? 'default' : 'destructive'}
              className={
                systemHealth.overall === 'healthy'
                  ? organizationTheme.badgeStyle
                  : 'bg-red-100 text-red-700'
              }
            >
              {systemHealth.overall}
            </Badge>
          )}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Endpoints */}
        <MetricCard
          title="Active Endpoints"
          value={dashboardData?.summary.totalEndpoints ?? 0}
          icon={<Server className="h-5 w-5" />}
          theme={organizationTheme}
          subtitle={`${dashboardData?.summary.healthyEndpoints ?? 0} healthy`}
        />

        {/* Active Alerts */}
        <MetricCard
          title="Active Alerts"
          value={dashboardData?.summary.activeAlerts ?? 0}
          icon={<AlertTriangle className="h-5 w-5" />}
          theme={organizationTheme}
          isAlert={true}
          subtitle={alertSummary?.critical ? `${alertSummary.critical} critical` : 'All clear'}
        />

        {/* Average Response Time */}
        <MetricCard
          title="Avg Response Time"
          value={`${Math.round(dashboardData?.summary.avgResponseTime ?? 0)}ms`}
          icon={<Activity className="h-5 w-5" />}
          theme={organizationTheme}
          subtitle="Request latency"
        />

        {/* Total Cost */}
        <MetricCard
          title="Daily Cost"
          value={`$${(dashboardData?.summary.totalCost ?? 0).toFixed(2)}`}
          icon={<DollarSign className="h-5 w-5" />}
          theme={organizationTheme}
          subtitle="Infrastructure spend"
        />
      </div>

      {/* Performance Metrics */}
      {dashboardData?.performanceMetrics && (
        <Card className={organizationTheme.cardStyle}>
          <CardHeader>
            <CardTitle className={organizationTheme.primaryColor}>
              Resource Utilization
            </CardTitle>
            <CardDescription>Current system resource usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ResourceMetric
                label="CPU Usage"
                value={dashboardData.performanceMetrics.cpuUtilization}
                theme={organizationTheme}
              />
              <ResourceMetric
                label="Memory Usage"
                value={dashboardData.performanceMetrics.memoryUtilization}
                theme={organizationTheme}
              />
              <ResourceMetric
                label="GPU Usage"
                value={dashboardData.performanceMetrics.gpuUtilization}
                theme={organizationTheme}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Metrics (if available) */}
      {dashboardData?.businessMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Inferences"
            value={dashboardData.businessMetrics.totalInferences.toLocaleString()}
            icon={<Zap className="h-5 w-5" />}
            theme={organizationTheme}
            subtitle="Models executed"
          />

          <MetricCard
            title="Active Users"
            value={dashboardData.businessMetrics.activeUsers}
            icon={<Users className="h-5 w-5" />}
            theme={organizationTheme}
            subtitle="Current session"
          />

          <MetricCard
            title="Cost per Inference"
            value={`$${dashboardData.businessMetrics.costPerInference.toFixed(4)}`}
            icon={<DollarSign className="h-5 w-5" />}
            theme={organizationTheme}
            subtitle="Average cost"
          />

          <MetricCard
            title="Revenue Today"
            value={`$${dashboardData.businessMetrics.revenueToday.toFixed(2)}`}
            icon={<DollarSign className="h-5 w-5" />}
            theme={organizationTheme}
            subtitle="Daily earnings"
          />
        </div>
      )}

      {/* Recent Alerts */}
      {alerts && alerts.length > 0 && (
        <Card className={organizationTheme.cardStyle}>
          <CardHeader>
            <CardTitle className={organizationTheme.primaryColor}>
              Recent Alerts
            </CardTitle>
            <CardDescription>Latest system notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert, index) => (
                <div
                  key={alert.id || index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <AlertTriangle
                      className={cn(
                        'h-4 w-4',
                        alert.severity === 'critical'
                          ? 'text-red-500'
                          : alert.severity === 'warning'
                          ? 'text-yellow-500'
                          : 'text-blue-500'
                      )}
                    />
                    <div>
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(alert.triggeredAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                  >
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Metric Card Component
 */
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  theme: any;
  subtitle?: string;
  isAlert?: boolean;
}

function MetricCard({ title, value, icon, theme, subtitle, isAlert }: MetricCardProps) {
  return (
    <Card className={theme.cardStyle}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p
              className={cn(
                'text-2xl font-bold',
                isAlert && typeof value === 'number' && value > 0
                  ? 'text-red-600'
                  : theme.primaryColor
              )}
            >
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={cn('p-2 rounded-lg', theme.accentColor)}>
            <div className={theme.primaryColor}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Resource Metric Component
 */
interface ResourceMetricProps {
  label: string;
  value: number;
  theme: any;
}

function ResourceMetric({ label, value, theme }: ResourceMetricProps) {
  const percentage = Math.min(Math.max(value, 0), 100);
  const isHigh = percentage > 80;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span
          className={cn(
            'text-sm',
            isHigh ? 'text-red-600' : theme.primaryColor
          )}
        >
          {percentage.toFixed(1)}%
        </span>
      </div>
      <Progress
        value={percentage}
        className="h-2"
        style={{
          '--progress-background': isHigh ? '#ef4444' : undefined,
        } as React.CSSProperties}
      />
    </div>
  );
}

export default MonitoringDashboard;