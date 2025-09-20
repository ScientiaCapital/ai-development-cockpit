#!/usr/bin/env node

/**
 * MCP Health Monitoring Dashboard
 * Comprehensive health monitoring and status reporting for all MCP servers
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MCPHealthMonitor {
    constructor() {
        this.servers = {
            'memory': {
                name: 'Memory',
                package: '@modelcontextprotocol/server-memory',
                description: 'Context persistence across sessions',
                status: 'unknown',
                lastCheck: null,
                responseTime: null,
                error: null
            },
            'sequential-thinking': {
                name: 'Sequential Thinking',
                package: '@modelcontextprotocol/server-sequential-thinking',
                description: 'Step-by-step problem solving',
                status: 'unknown',
                lastCheck: null,
                responseTime: null,
                error: null
            },
            'taskmaster-ai': {
                name: 'Task Master AI',
                package: 'task-master-ai',
                description: 'Task management with research capabilities',
                status: 'unknown',
                lastCheck: null,
                responseTime: null,
                error: null
            },
            'shrimp-task-manager': {
                name: 'Shrimp Task Manager',
                package: '@tmkipper/shrimp-task-manager',
                description: 'Advanced task planning and verification',
                status: 'unknown',
                lastCheck: null,
                responseTime: null,
                error: null
            },
            'serena': {
                name: 'Serena',
                package: '@wonderwhy-er/serena-mcp-server',
                description: 'Code intelligence and navigation',
                status: 'unknown',
                lastCheck: null,
                responseTime: null,
                error: null
            },
            'desktop-commander': {
                name: 'Desktop Commander',
                package: '@desktop-commander/mcp-server',
                description: 'Desktop automation and file management',
                status: 'unknown',
                lastCheck: null,
                responseTime: null,
                error: null
            }
        };

        this.healthHistory = {};
        this.alertThresholds = {
            responseTime: 5000, // 5 seconds
            consecutiveFailures: 3,
            uptimeMinimum: 0.95 // 95%
        };
    }

    /**
     * Check health of a specific MCP server
     */
    async checkServerHealth(serverId) {
        const server = this.servers[serverId];
        if (!server) {
            throw new Error(`Unknown server: ${serverId}`);
        }

        const startTime = Date.now();

        try {
            // Try to spawn the server with a quick health check
            const result = await this.pingServer(server.package);

            const responseTime = Date.now() - startTime;

            server.status = result.success ? 'healthy' : 'unhealthy';
            server.lastCheck = new Date().toISOString();
            server.responseTime = responseTime;
            server.error = result.error || null;

            // Record health history
            this.recordHealthEvent(serverId, server.status, responseTime);

            return {
                serverId,
                ...server,
                uptime: this.calculateUptime(serverId)
            };

        } catch (error) {
            const responseTime = Date.now() - startTime;

            server.status = 'error';
            server.lastCheck = new Date().toISOString();
            server.responseTime = responseTime;
            server.error = error.message;

            this.recordHealthEvent(serverId, 'error', responseTime);

            return {
                serverId,
                ...server,
                uptime: this.calculateUptime(serverId)
            };
        }
    }

    /**
     * Ping a server package to check if it's available
     */
    async pingServer(packageName) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({ success: false, error: 'Timeout after 10 seconds' });
            }, 10000);

            const child = spawn('npx', ['-y', `--package=${packageName}`, '--help'], {
                stdio: 'pipe'
            });

            child.on('close', (code) => {
                clearTimeout(timeout);
                resolve({
                    success: code === 0 || code === 1, // Many help commands exit with code 1
                    error: null
                });
            });

            child.on('error', (error) => {
                clearTimeout(timeout);
                resolve({
                    success: false,
                    error: error.message
                });
            });
        });
    }

    /**
     * Record health event for historical tracking
     */
    recordHealthEvent(serverId, status, responseTime) {
        if (!this.healthHistory[serverId]) {
            this.healthHistory[serverId] = [];
        }

        this.healthHistory[serverId].push({
            timestamp: Date.now(),
            status,
            responseTime
        });

        // Keep only last 100 events per server
        if (this.healthHistory[serverId].length > 100) {
            this.healthHistory[serverId] = this.healthHistory[serverId].slice(-100);
        }
    }

    /**
     * Calculate uptime percentage for a server
     */
    calculateUptime(serverId) {
        const history = this.healthHistory[serverId];
        if (!history || history.length === 0) {
            return 0;
        }

        const healthyEvents = history.filter(event => event.status === 'healthy').length;
        return (healthyEvents / history.length) * 100;
    }

    /**
     * Check health of all MCP servers
     */
    async checkAllServers() {
        const results = {};

        console.log('🔍 Checking health of all MCP servers...\n');

        for (const serverId of Object.keys(this.servers)) {
            console.log(`⏳ Checking ${this.servers[serverId].name}...`);
            results[serverId] = await this.checkServerHealth(serverId);

            const status = results[serverId].status;
            const emoji = status === 'healthy' ? '✅' : status === 'unhealthy' ? '⚠️' : '❌';
            const responseTime = results[serverId].responseTime;

            console.log(`${emoji} ${this.servers[serverId].name}: ${status} (${responseTime}ms)`);
        }

        return results;
    }

    /**
     * Generate comprehensive health report
     */
    generateHealthReport(results) {
        const totalServers = Object.keys(results).length;
        const healthyServers = Object.values(results).filter(r => r.status === 'healthy').length;
        const unhealthyServers = Object.values(results).filter(r => r.status === 'unhealthy').length;
        const errorServers = Object.values(results).filter(r => r.status === 'error').length;

        const overallHealth = (healthyServers / totalServers) * 100;

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalServers,
                healthyServers,
                unhealthyServers,
                errorServers,
                overallHealth: Math.round(overallHealth * 100) / 100
            },
            servers: results,
            alerts: this.generateAlerts(results),
            recommendations: this.generateRecommendations(results)
        };

        return report;
    }

    /**
     * Generate alerts based on health check results
     */
    generateAlerts(results) {
        const alerts = [];

        for (const [serverId, result] of Object.entries(results)) {
            // High response time alert
            if (result.responseTime > this.alertThresholds.responseTime) {
                alerts.push({
                    severity: 'warning',
                    serverId,
                    message: `High response time: ${result.responseTime}ms (threshold: ${this.alertThresholds.responseTime}ms)`,
                    timestamp: new Date().toISOString()
                });
            }

            // Low uptime alert
            if (result.uptime < this.alertThresholds.uptimeMinimum * 100) {
                alerts.push({
                    severity: 'critical',
                    serverId,
                    message: `Low uptime: ${result.uptime.toFixed(2)}% (minimum: ${this.alertThresholds.uptimeMinimum * 100}%)`,
                    timestamp: new Date().toISOString()
                });
            }

            // Error status alert
            if (result.status === 'error') {
                alerts.push({
                    severity: 'critical',
                    serverId,
                    message: `Server error: ${result.error}`,
                    timestamp: new Date().toISOString()
                });
            }
        }

        return alerts;
    }

    /**
     * Generate recommendations for improving MCP server health
     */
    generateRecommendations(results) {
        const recommendations = [];

        const errorServers = Object.entries(results).filter(([_, result]) => result.status === 'error');
        if (errorServers.length > 0) {
            recommendations.push({
                type: 'installation',
                message: `${errorServers.length} server(s) failed to start. Run 'npm install -g ${errorServers.map(([_, r]) => r.package).join(' ')}' to install missing packages.`,
                servers: errorServers.map(([id, _]) => id)
            });
        }

        const slowServers = Object.entries(results).filter(([_, result]) => result.responseTime > this.alertThresholds.responseTime);
        if (slowServers.length > 0) {
            recommendations.push({
                type: 'performance',
                message: `${slowServers.length} server(s) have high response times. Consider system resource optimization or package updates.`,
                servers: slowServers.map(([id, _]) => id)
            });
        }

        const overallHealth = (Object.values(results).filter(r => r.status === 'healthy').length / Object.keys(results).length) * 100;
        if (overallHealth < 80) {
            recommendations.push({
                type: 'system',
                message: `Overall system health is ${overallHealth.toFixed(2)}%. Consider running system diagnostics and updating MCP server packages.`,
                servers: []
            });
        }

        return recommendations;
    }

    /**
     * Display formatted health report in console
     */
    displayReport(report) {
        console.log('\n');
        console.log('=' .repeat(80));
        console.log('🏥 MCP HEALTH MONITORING DASHBOARD');
        console.log('=' .repeat(80));

        console.log('\n📊 OVERALL SYSTEM HEALTH');
        console.log('-' .repeat(40));
        console.log(`Total Servers: ${report.summary.totalServers}`);
        console.log(`✅ Healthy: ${report.summary.healthyServers}`);
        console.log(`⚠️  Unhealthy: ${report.summary.unhealthyServers}`);
        console.log(`❌ Error: ${report.summary.errorServers}`);
        console.log(`🎯 Overall Health: ${report.summary.overallHealth}%`);

        console.log('\n📋 SERVER DETAILS');
        console.log('-' .repeat(40));
        for (const [serverId, server] of Object.entries(report.servers)) {
            const statusEmoji = server.status === 'healthy' ? '✅' : server.status === 'unhealthy' ? '⚠️' : '❌';
            console.log(`${statusEmoji} ${server.name}`);
            console.log(`   Status: ${server.status}`);
            console.log(`   Response Time: ${server.responseTime}ms`);
            console.log(`   Uptime: ${server.uptime.toFixed(2)}%`);
            console.log(`   Last Check: ${server.lastCheck}`);
            if (server.error) {
                console.log(`   Error: ${server.error}`);
            }
            console.log('');
        }

        if (report.alerts.length > 0) {
            console.log('\n🚨 ALERTS');
            console.log('-' .repeat(40));
            for (const alert of report.alerts) {
                const severityEmoji = alert.severity === 'critical' ? '🔴' : '🟡';
                console.log(`${severityEmoji} ${alert.message}`);
                console.log(`   Server: ${report.servers[alert.serverId].name}`);
                console.log(`   Time: ${alert.timestamp}`);
                console.log('');
            }
        }

        if (report.recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS');
            console.log('-' .repeat(40));
            for (const rec of report.recommendations) {
                console.log(`📌 ${rec.message}`);
                if (rec.servers.length > 0) {
                    console.log(`   Affected: ${rec.servers.map(id => report.servers[id].name).join(', ')}`);
                }
                console.log('');
            }
        }

        console.log('\n' + '=' .repeat(80));
        console.log(`Last Updated: ${report.timestamp}`);
        console.log('=' .repeat(80));
    }

    /**
     * Save health report to file
     */
    async saveReport(report, filename = null) {
        if (!filename) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            filename = `mcp-health-report-${timestamp}.json`;
        }

        const reportPath = path.join(__dirname, 'reports', filename);

        // Ensure reports directory exists
        await fs.mkdir(path.dirname(reportPath), { recursive: true });

        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Report saved to: ${reportPath}`);

        return reportPath;
    }

    /**
     * Run continuous monitoring
     */
    async startMonitoring(intervalMinutes = 5) {
        console.log(`🔄 Starting continuous monitoring (checking every ${intervalMinutes} minutes)...`);

        const monitor = async () => {
            try {
                const results = await this.checkAllServers();
                const report = this.generateHealthReport(results);
                this.displayReport(report);

                // Save report with alerts
                if (report.alerts.length > 0) {
                    await this.saveReport(report);
                }

            } catch (error) {
                console.error('❌ Monitoring error:', error.message);
            }
        };

        // Initial check
        await monitor();

        // Set up interval
        setInterval(monitor, intervalMinutes * 60 * 1000);
    }
}

// CLI Interface
async function main() {
    const monitor = new MCPHealthMonitor();
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
MCP Health Monitor - Comprehensive health monitoring for MCP servers

Usage:
  node mcp-health-monitor.js [options]

Options:
  --continuous, -c    Start continuous monitoring (default: 5 minute intervals)
  --interval <min>    Set monitoring interval in minutes (requires --continuous)
  --save              Save health report to file
  --server <id>       Check specific server only
  --json              Output in JSON format
  --help, -h          Show this help message

Examples:
  node mcp-health-monitor.js                    # Single health check
  node mcp-health-monitor.js --continuous       # Continuous monitoring
  node mcp-health-monitor.js --interval 10 -c   # Monitor every 10 minutes
  node mcp-health-monitor.js --server memory    # Check memory server only
  node mcp-health-monitor.js --save --json      # Save JSON report
        `);
        return;
    }

    try {
        if (args.includes('--server')) {
            const serverIndex = args.indexOf('--server');
            const serverId = args[serverIndex + 1];

            if (!serverId || !monitor.servers[serverId]) {
                console.error('❌ Invalid or missing server ID');
                console.log('Available servers:', Object.keys(monitor.servers).join(', '));
                return;
            }

            console.log(`🔍 Checking ${monitor.servers[serverId].name}...`);
            const result = await monitor.checkServerHealth(serverId);
            const report = monitor.generateHealthReport({ [serverId]: result });

            if (args.includes('--json')) {
                console.log(JSON.stringify(report, null, 2));
            } else {
                monitor.displayReport(report);
            }

            if (args.includes('--save')) {
                await monitor.saveReport(report);
            }

        } else if (args.includes('--continuous') || args.includes('-c')) {
            let interval = 5; // default 5 minutes

            if (args.includes('--interval')) {
                const intervalIndex = args.indexOf('--interval');
                const intervalValue = parseInt(args[intervalIndex + 1]);
                if (intervalValue && intervalValue > 0) {
                    interval = intervalValue;
                }
            }

            await monitor.startMonitoring(interval);

        } else {
            // Single health check
            const results = await monitor.checkAllServers();
            const report = monitor.generateHealthReport(results);

            if (args.includes('--json')) {
                console.log(JSON.stringify(report, null, 2));
            } else {
                monitor.displayReport(report);
            }

            if (args.includes('--save')) {
                await monitor.saveReport(report);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down MCP Health Monitor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down MCP Health Monitor...');
    process.exit(0);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    });
}

export default MCPHealthMonitor;