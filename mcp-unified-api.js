#!/usr/bin/env node

/**
 * MCP Unified API Interface
 * Provides a single API interface to interact with all MCP servers
 * Includes intelligent routing, load balancing, and context sharing
 */

import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MCPUnifiedAPI extends EventEmitter {
    constructor(options = {}) {
        super();

        this.servers = {
            memory: {
                name: 'Memory',
                capabilities: ['create_entities', 'add_observations', 'search_nodes', 'read_graph'],
                connection: null,
                status: 'disconnected',
                loadScore: 0
            },
            'sequential-thinking': {
                name: 'Sequential Thinking',
                capabilities: ['sequentialthinking'],
                connection: null,
                status: 'disconnected',
                loadScore: 0
            },
            'taskmaster-ai': {
                name: 'Task Master AI',
                capabilities: ['get_tasks', 'add_task', 'set_task_status', 'expand_task', 'parse_prd'],
                connection: null,
                status: 'disconnected',
                loadScore: 0
            },
            'shrimp-task-manager': {
                name: 'Shrimp Task Manager',
                capabilities: ['plan_task', 'analyze_task', 'split_tasks', 'execute_task', 'verify_task'],
                connection: null,
                status: 'disconnected',
                loadScore: 0
            },
            serena: {
                name: 'Serena',
                capabilities: ['find_symbol', 'read_file', 'write_memory', 'search_for_pattern'],
                connection: null,
                status: 'disconnected',
                loadScore: 0
            },
            'desktop-commander': {
                name: 'Desktop Commander',
                capabilities: ['read_file', 'write_file', 'execute_shell_command', 'list_directory'],
                connection: null,
                status: 'disconnected',
                loadScore: 0
            }
        };

        this.contextStore = new Map();
        this.requestHistory = [];
        this.loadBalancing = options.loadBalancing !== false;
        this.maxRetries = options.maxRetries || 3;
        this.requestTimeout = options.requestTimeout || 30000;

        // Intelligent routing rules
        this.routingRules = {
            // Memory operations
            memory: ['create_entities', 'add_observations', 'search_nodes', 'read_graph', 'delete_entities'],

            // Task management operations
            taskManagement: {
                strategic: ['get_tasks', 'parse_prd', 'analyze_project_complexity', 'add_task'],
                tactical: ['plan_task', 'analyze_task', 'split_tasks', 'execute_task', 'verify_task'],
                server_mapping: {
                    strategic: 'taskmaster-ai',
                    tactical: 'shrimp-task-manager'
                }
            },

            // Code operations
            codeIntelligence: ['find_symbol', 'get_symbols_overview', 'search_for_pattern', 'read_file', 'write_memory'],

            // File system operations
            fileSystem: ['read_file', 'write_file', 'list_directory', 'create_directory', 'move_file'],

            // Thinking operations
            reasoning: ['sequentialthinking'],

            // System operations
            system: ['execute_shell_command', 'start_process', 'list_processes']
        };
    }

    /**
     * Initialize all MCP server connections
     */
    async initialize() {
        console.log('🚀 Initializing MCP Unified API...');

        const connectionPromises = Object.keys(this.servers).map(serverId =>
            this.connectToServer(serverId).catch(error => ({
                serverId,
                error: error.message,
                connected: false
            }))
        );

        const results = await Promise.allSettled(connectionPromises);

        let connectedCount = 0;
        let failedCount = 0;

        results.forEach((result, index) => {
            const serverId = Object.keys(this.servers)[index];

            if (result.status === 'fulfilled' && result.value.connected !== false) {
                connectedCount++;
                this.servers[serverId].status = 'connected';
                console.log(`✅ Connected to ${this.servers[serverId].name}`);
            } else {
                failedCount++;
                this.servers[serverId].status = 'failed';
                const error = result.status === 'rejected' ? result.reason.message : result.value.error;
                console.log(`❌ Failed to connect to ${this.servers[serverId].name}: ${error}`);
            }
        });

        console.log(`\n📊 Connection Summary: ${connectedCount} connected, ${failedCount} failed`);

        if (connectedCount === 0) {
            throw new Error('No MCP servers could be connected');
        }

        this.emit('initialized', {
            connectedServers: connectedCount,
            failedServers: failedCount,
            totalServers: Object.keys(this.servers).length
        });

        return {
            success: true,
            connectedServers: connectedCount,
            failedServers: failedCount
        };
    }

    /**
     * Connect to a specific MCP server
     */
    async connectToServer(serverId) {
        const server = this.servers[serverId];
        if (!server) {
            throw new Error(`Unknown server: ${serverId}`);
        }

        try {
            // Mock connection - in real implementation, this would use MCP client libraries
            await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

            server.connection = {
                id: serverId,
                connected: true,
                connectedAt: new Date().toISOString()
            };

            server.status = 'connected';

            return { serverId, connected: true };

        } catch (error) {
            server.status = 'failed';
            throw new Error(`Failed to connect to ${server.name}: ${error.message}`);
        }
    }

    /**
     * Route a request to the appropriate MCP server
     */
    routeRequest(operation, data = {}) {
        // Memory operations
        if (this.routingRules.memory.includes(operation)) {
            return 'memory';
        }

        // Task management operations
        if (this.routingRules.taskManagement.strategic.includes(operation)) {
            return 'taskmaster-ai';
        }

        if (this.routingRules.taskManagement.tactical.includes(operation)) {
            return 'shrimp-task-manager';
        }

        // Code intelligence operations
        if (this.routingRules.codeIntelligence.includes(operation)) {
            return 'serena';
        }

        // File system operations
        if (this.routingRules.fileSystem.includes(operation)) {
            return 'desktop-commander';
        }

        // Reasoning operations
        if (this.routingRules.reasoning.includes(operation)) {
            return 'sequential-thinking';
        }

        // System operations
        if (this.routingRules.system.includes(operation)) {
            return 'desktop-commander';
        }

        // Fallback: find server with capability
        for (const [serverId, server] of Object.entries(this.servers)) {
            if (server.capabilities.includes(operation) && server.status === 'connected') {
                return serverId;
            }
        }

        throw new Error(`No available server found for operation: ${operation}`);
    }

    /**
     * Select the best server for load balancing
     */
    selectServerForLoadBalancing(candidateServers) {
        if (!this.loadBalancing || candidateServers.length === 1) {
            return candidateServers[0];
        }

        // Select server with lowest load score
        const serverLoads = candidateServers.map(serverId => ({
            serverId,
            loadScore: this.servers[serverId].loadScore
        }));

        serverLoads.sort((a, b) => a.loadScore - b.loadScore);

        return serverLoads[0].serverId;
    }

    /**
     * Execute an operation on the appropriate MCP server
     */
    async execute(operation, data = {}, options = {}) {
        const requestId = this.generateRequestId();
        const startTime = Date.now();

        try {
            // Route the request
            const targetServerId = this.routeRequest(operation, data);
            const targetServer = this.servers[targetServerId];

            if (targetServer.status !== 'connected') {
                throw new Error(`Target server ${targetServer.name} is not connected`);
            }

            console.log(`🎯 Routing ${operation} to ${targetServer.name} (ID: ${requestId})`);

            // Update load score
            targetServer.loadScore += 1;

            // Add context if available
            const context = this.getRelevantContext(operation, data);
            if (context) {
                data._context = context;
            }

            // Execute the operation (mock implementation)
            const result = await this.executeOnServer(targetServerId, operation, data, options);

            // Update context store
            this.updateContext(operation, data, result);

            // Record request
            this.recordRequest(requestId, operation, targetServerId, Date.now() - startTime, true);

            // Decrease load score
            targetServer.loadScore = Math.max(0, targetServer.loadScore - 1);

            this.emit('operationCompleted', {
                requestId,
                operation,
                serverId: targetServerId,
                duration: Date.now() - startTime,
                success: true
            });

            return {
                success: true,
                data: result,
                serverId: targetServerId,
                requestId,
                duration: Date.now() - startTime
            };

        } catch (error) {
            this.recordRequest(requestId, operation, null, Date.now() - startTime, false, error.message);

            this.emit('operationFailed', {
                requestId,
                operation,
                error: error.message,
                duration: Date.now() - startTime
            });

            throw error;
        }
    }

    /**
     * Execute operation on specific server (mock implementation)
     */
    async executeOnServer(serverId, operation, data, options) {
        const server = this.servers[serverId];

        // Simulate API call delay
        const baseDelay = 100;
        const variableDelay = Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, baseDelay + variableDelay));

        // Mock response based on operation
        const mockResponses = {
            // Memory operations
            create_entities: { created: data.entities?.length || 1, status: 'success' },
            search_nodes: { nodes: [], total: 0, query: data.query },
            read_graph: { entities: [], relations: [], totalEntities: 0, totalRelations: 0 },

            // Task management operations
            get_tasks: { tasks: [], total: 0, status: 'success' },
            add_task: { taskId: this.generateId(), title: data.prompt, status: 'pending' },
            set_task_status: { taskId: data.id, status: data.status, updated: true },

            // Code operations
            find_symbol: { symbols: [], matches: 0, pattern: data.name_path },
            read_file: { content: '', lines: 0, path: data.relative_path },
            write_memory: { memoryName: data.memory_name, status: 'saved' },

            // File operations
            list_directory: { files: [], directories: [], path: data.path },
            execute_shell_command: { stdout: '', stderr: '', exitCode: 0, command: data.command },

            // Thinking operations
            sequentialthinking: {
                thought: data.thought,
                thoughtNumber: data.thoughtNumber,
                nextThoughtNeeded: data.nextThoughtNeeded
            }
        };

        return mockResponses[operation] || {
            operation,
            serverId,
            data,
            timestamp: new Date().toISOString(),
            status: 'completed'
        };
    }

    /**
     * Get relevant context for an operation
     */
    getRelevantContext(operation, data) {
        const contextKeys = Array.from(this.contextStore.keys());
        const relevantContext = {};

        // Add project context if available
        if (this.contextStore.has('project')) {
            relevantContext.project = this.contextStore.get('project');
        }

        // Add recent task context for task operations
        if (operation.includes('task') && this.contextStore.has('currentTask')) {
            relevantContext.currentTask = this.contextStore.get('currentTask');
        }

        // Add file context for file operations
        if (data.relative_path || data.path) {
            const filePath = data.relative_path || data.path;
            if (this.contextStore.has(`file:${filePath}`)) {
                relevantContext.fileHistory = this.contextStore.get(`file:${filePath}`);
            }
        }

        return Object.keys(relevantContext).length > 0 ? relevantContext : null;
    }

    /**
     * Update context store with operation results
     */
    updateContext(operation, data, result) {
        // Update current task context
        if (operation.includes('task') && result.taskId) {
            this.contextStore.set('currentTask', {
                taskId: result.taskId,
                operation,
                timestamp: new Date().toISOString(),
                result
            });
        }

        // Update file context
        if (data.relative_path || data.path) {
            const filePath = data.relative_path || data.path;
            const existingContext = this.contextStore.get(`file:${filePath}`) || [];
            existingContext.push({
                operation,
                timestamp: new Date().toISOString(),
                result
            });

            // Keep only last 10 operations per file
            if (existingContext.length > 10) {
                existingContext.splice(0, existingContext.length - 10);
            }

            this.contextStore.set(`file:${filePath}`, existingContext);
        }

        // Update project context
        if (operation === 'parse_prd' || operation === 'analyze_project_complexity') {
            this.contextStore.set('project', {
                lastAnalysis: new Date().toISOString(),
                operation,
                result
            });
        }
    }

    /**
     * Record request for analytics
     */
    recordRequest(requestId, operation, serverId, duration, success, error = null) {
        this.requestHistory.push({
            requestId,
            operation,
            serverId,
            duration,
            success,
            error,
            timestamp: new Date().toISOString()
        });

        // Keep only last 1000 requests
        if (this.requestHistory.length > 1000) {
            this.requestHistory.splice(0, this.requestHistory.length - 1000);
        }
    }

    /**
     * Get system analytics
     */
    getAnalytics() {
        const totalRequests = this.requestHistory.length;
        const successfulRequests = this.requestHistory.filter(r => r.success).length;
        const failedRequests = totalRequests - successfulRequests;

        const operationCounts = {};
        const serverCounts = {};
        let totalDuration = 0;

        this.requestHistory.forEach(request => {
            operationCounts[request.operation] = (operationCounts[request.operation] || 0) + 1;
            if (request.serverId) {
                serverCounts[request.serverId] = (serverCounts[request.serverId] || 0) + 1;
            }
            totalDuration += request.duration;
        });

        const averageDuration = totalRequests > 0 ? totalDuration / totalRequests : 0;

        return {
            requests: {
                total: totalRequests,
                successful: successfulRequests,
                failed: failedRequests,
                successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0
            },
            performance: {
                averageDuration: Math.round(averageDuration),
                totalDuration
            },
            operations: operationCounts,
            servers: serverCounts,
            contextEntries: this.contextStore.size
        };
    }

    /**
     * Get server status
     */
    getServerStatus() {
        const status = {};

        for (const [serverId, server] of Object.entries(this.servers)) {
            status[serverId] = {
                name: server.name,
                status: server.status,
                loadScore: server.loadScore,
                capabilities: server.capabilities,
                connected: server.status === 'connected'
            };
        }

        return status;
    }

    /**
     * Health check for all servers
     */
    async healthCheck() {
        const healthStatus = {};

        for (const [serverId, server] of Object.entries(this.servers)) {
            try {
                if (server.status === 'connected') {
                    // Perform a lightweight operation to check health
                    const startTime = Date.now();
                    await this.executeOnServer(serverId, 'health_check', {}, { timeout: 5000 });
                    const responseTime = Date.now() - startTime;

                    healthStatus[serverId] = {
                        status: 'healthy',
                        responseTime,
                        lastCheck: new Date().toISOString()
                    };
                } else {
                    healthStatus[serverId] = {
                        status: 'disconnected',
                        responseTime: null,
                        lastCheck: new Date().toISOString()
                    };
                }
            } catch (error) {
                healthStatus[serverId] = {
                    status: 'unhealthy',
                    error: error.message,
                    lastCheck: new Date().toISOString()
                };
            }
        }

        return healthStatus;
    }

    /**
     * Utility methods
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Shutdown all connections
     */
    async shutdown() {
        console.log('👋 Shutting down MCP Unified API...');

        for (const [serverId, server] of Object.entries(this.servers)) {
            if (server.connection) {
                // Close connection (mock)
                server.connection = null;
                server.status = 'disconnected';
            }
        }

        this.emit('shutdown');
        console.log('✅ MCP Unified API shutdown complete');
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
MCP Unified API - Single interface for all MCP servers

Usage:
  node mcp-unified-api.js [command] [options]

Commands:
  start                   Start the unified API service
  status                  Show server status
  health                  Perform health check
  analytics               Show system analytics
  execute <operation>     Execute a specific operation

Options:
  --port <port>          API server port (default: 3333)
  --no-load-balancing    Disable load balancing
  --timeout <ms>         Request timeout in milliseconds (default: 30000)
  --help, -h             Show this help message

Examples:
  node mcp-unified-api.js start                    # Start API service
  node mcp-unified-api.js status                   # Show status
  node mcp-unified-api.js health                   # Health check
  node mcp-unified-api.js execute get_tasks        # Execute operation
        `);
        return;
    }

    const command = args[0] || 'start';
    const api = new MCPUnifiedAPI({
        loadBalancing: !args.includes('--no-load-balancing'),
        requestTimeout: args.includes('--timeout') ?
            parseInt(args[args.indexOf('--timeout') + 1]) : 30000
    });

    try {
        switch (command) {
            case 'start':
                await api.initialize();
                console.log('\n🌟 MCP Unified API is ready!');
                console.log('Use Ctrl+C to shutdown');

                // Keep the process alive
                process.stdin.resume();
                break;

            case 'status':
                await api.initialize();
                const status = api.getServerStatus();
                console.log('\n📊 Server Status:');
                console.table(status);
                break;

            case 'health':
                await api.initialize();
                const healthStatus = await api.healthCheck();
                console.log('\n🏥 Health Check Results:');
                console.table(healthStatus);
                break;

            case 'analytics':
                await api.initialize();
                const analytics = api.getAnalytics();
                console.log('\n📈 System Analytics:');
                console.log(JSON.stringify(analytics, null, 2));
                break;

            case 'execute':
                const operation = args[1];
                if (!operation) {
                    console.error('❌ Operation name required');
                    return;
                }

                await api.initialize();
                const result = await api.execute(operation, {});
                console.log('\n✅ Operation Result:');
                console.log(JSON.stringify(result, null, 2));
                break;

            default:
                console.error(`❌ Unknown command: ${command}`);
                console.log('Use --help for available commands');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down...');
    process.exit(0);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    });
}

export default MCPUnifiedAPI;