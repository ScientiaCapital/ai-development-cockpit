#!/usr/bin/env node

/**
 * MCP Context Persistence System
 * Manages context sharing and persistence across all MCP servers
 * Provides intelligent context propagation and session management
 */

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MCPContextPersistence extends EventEmitter {
    constructor(options = {}) {
        super();

        this.contextDir = options.contextDir || path.join(__dirname, 'context');
        this.sessionId = options.sessionId || this.generateSessionId();
        this.maxContextSize = options.maxContextSize || 1024 * 1024; // 1MB
        this.maxHistoryItems = options.maxHistoryItems || 1000;
        this.autoSave = options.autoSave !== false;
        this.compressionEnabled = options.compression !== false;

        // Context stores
        this.globalContext = new Map();
        this.sessionContext = new Map();
        this.serverContexts = new Map();
        this.crossSessionMemory = new Map();

        // Operation history for context learning
        this.operationHistory = [];
        this.contextRelationships = new Map();
        this.contextPatterns = new Map();

        // Context types and their behaviors
        this.contextTypes = {
            PROJECT: {
                persistence: 'global',
                sharing: 'all_servers',
                expiry: null // never expires
            },
            TASK: {
                persistence: 'session',
                sharing: 'task_servers',
                expiry: 24 * 60 * 60 * 1000 // 24 hours
            },
            FILE: {
                persistence: 'global',
                sharing: 'file_servers',
                expiry: 7 * 24 * 60 * 60 * 1000 // 7 days
            },
            USER_PREFERENCE: {
                persistence: 'cross_session',
                sharing: 'all_servers',
                expiry: null
            },
            TEMPORARY: {
                persistence: 'session',
                sharing: 'single_server',
                expiry: 60 * 60 * 1000 // 1 hour
            }
        };

        // Server groups for targeted context sharing
        this.serverGroups = {
            task_servers: ['taskmaster-ai', 'shrimp-task-manager'],
            file_servers: ['serena', 'desktop-commander'],
            memory_servers: ['memory'],
            all_servers: ['memory', 'sequential-thinking', 'taskmaster-ai', 'shrimp-task-manager', 'serena', 'desktop-commander']
        };

        this.initialized = false;
    }

    /**
     * Initialize the context persistence system
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Ensure context directory exists
            await fs.mkdir(this.contextDir, { recursive: true });

            // Load existing contexts
            await this.loadGlobalContext();
            await this.loadCrossSessionMemory();
            await this.loadContextPatterns();

            // Initialize server contexts
            for (const serverId of this.serverGroups.all_servers) {
                this.serverContexts.set(serverId, new Map());
            }

            // Start auto-save if enabled
            if (this.autoSave) {
                this.startAutoSave();
            }

            this.initialized = true;
            this.emit('initialized', { sessionId: this.sessionId });

            console.log(`🧠 Context Persistence initialized (Session: ${this.sessionId})`);

        } catch (error) {
            throw new Error(`Failed to initialize context persistence: ${error.message}`);
        }
    }

    /**
     * Store context with intelligent categorization
     */
    async storeContext(key, value, options = {}) {
        const contextType = options.type || this.inferContextType(key, value);
        const metadata = {
            type: contextType,
            timestamp: Date.now(),
            serverId: options.serverId,
            operation: options.operation,
            size: JSON.stringify(value).length,
            ttl: options.ttl || this.contextTypes[contextType]?.expiry,
            tags: options.tags || []
        };

        const contextEntry = {
            key,
            value,
            metadata
        };

        // Validate context size
        if (metadata.size > this.maxContextSize) {
            console.warn(`⚠️ Context entry '${key}' exceeds maximum size, compressing...`);
            if (this.compressionEnabled) {
                contextEntry.value = await this.compressContext(value);
                contextEntry.metadata.compressed = true;
            } else {
                throw new Error(`Context entry '${key}' too large and compression disabled`);
            }
        }

        // Store in appropriate context store
        const persistence = this.contextTypes[contextType].persistence;
        switch (persistence) {
            case 'global':
                this.globalContext.set(key, contextEntry);
                break;
            case 'session':
                this.sessionContext.set(key, contextEntry);
                break;
            case 'cross_session':
                this.crossSessionMemory.set(key, contextEntry);
                break;
        }

        // Propagate to relevant servers
        await this.propagateContext(key, contextEntry);

        // Learn context relationships
        this.learnContextRelationships(key, contextEntry);

        // Auto-save if enabled
        if (this.autoSave) {
            await this.saveContexts();
        }

        this.emit('contextStored', { key, type: contextType, size: metadata.size });

        return {
            key,
            type: contextType,
            persistence,
            propagatedTo: this.getTargetServers(contextType)
        };
    }

    /**
     * Retrieve context with smart merging
     */
    async getContext(key, options = {}) {
        const includeExpired = options.includeExpired || false;
        const serverId = options.serverId;

        // Search in all context stores
        const stores = [
            this.globalContext,
            this.sessionContext,
            this.crossSessionMemory
        ];

        // Add server-specific context if requested
        if (serverId && this.serverContexts.has(serverId)) {
            stores.push(this.serverContexts.get(serverId));
        }

        for (const store of stores) {
            if (store.has(key)) {
                const contextEntry = store.get(key);

                // Check expiry
                if (!includeExpired && this.isExpired(contextEntry)) {
                    continue;
                }

                // Decompress if needed
                if (contextEntry.metadata.compressed) {
                    contextEntry.value = await this.decompressContext(contextEntry.value);
                }

                // Record access for learning
                this.recordContextAccess(key, contextEntry);

                return contextEntry;
            }
        }

        return null;
    }

    /**
     * Get relevant context for an operation
     */
    async getRelevantContext(operation, data = {}, serverId = null) {
        const relevantContext = {};

        // Get operation-specific context
        const operationContext = await this.getOperationContext(operation);
        if (operationContext) {
            relevantContext.operation = operationContext;
        }

        // Get project context
        const projectContext = await this.getContext('project');
        if (projectContext) {
            relevantContext.project = projectContext.value;
        }

        // Get file context if applicable
        if (data.file_path || data.relative_path || data.path) {
            const filePath = data.file_path || data.relative_path || data.path;
            const fileContext = await this.getContext(`file:${filePath}`);
            if (fileContext) {
                relevantContext.file = fileContext.value;
            }
        }

        // Get task context if applicable
        if (operation.includes('task') || data.taskId) {
            const taskId = data.taskId || 'current';
            const taskContext = await this.getContext(`task:${taskId}`);
            if (taskContext) {
                relevantContext.task = taskContext.value;
            }
        }

        // Get server-specific context
        if (serverId) {
            const serverContext = await this.getServerContext(serverId);
            if (serverContext && Object.keys(serverContext).length > 0) {
                relevantContext.server = serverContext;
            }
        }

        // Get pattern-based context
        const patternContext = await this.getPatternContext(operation, data);
        if (patternContext) {
            relevantContext.patterns = patternContext;
        }

        return Object.keys(relevantContext).length > 0 ? relevantContext : null;
    }

    /**
     * Update context based on operation results
     */
    async updateContextFromOperation(operation, inputData, result, serverId) {
        const timestamp = Date.now();

        // Store operation in history
        this.operationHistory.push({
            operation,
            inputData,
            result,
            serverId,
            timestamp
        });

        // Trim history if too large
        if (this.operationHistory.length > this.maxHistoryItems) {
            this.operationHistory.splice(0, this.operationHistory.length - this.maxHistoryItems);
        }

        // Update specific contexts based on operation type
        switch (true) {
            case operation.includes('task'):
                await this.updateTaskContext(operation, inputData, result);
                break;

            case operation.includes('file') || operation === 'read_file' || operation === 'write_file':
                await this.updateFileContext(operation, inputData, result);
                break;

            case operation === 'parse_prd' || operation === 'analyze_project_complexity':
                await this.updateProjectContext(operation, inputData, result);
                break;

            case operation.includes('memory') || operation === 'write_memory':
                await this.updateMemoryContext(operation, inputData, result);
                break;
        }

        // Update server-specific context
        await this.updateServerContext(serverId, operation, result);

        this.emit('contextUpdated', { operation, serverId, timestamp });
    }

    /**
     * Update task-related context
     */
    async updateTaskContext(operation, inputData, result) {
        const taskId = inputData.taskId || inputData.id || 'current';
        const contextKey = `task:${taskId}`;

        const existingContext = await this.getContext(contextKey);
        const taskContext = existingContext ? existingContext.value : {};

        // Update task context based on operation
        switch (operation) {
            case 'get_tasks':
                taskContext.availableTasks = result.tasks || result.data;
                taskContext.lastTasksUpdate = Date.now();
                break;

            case 'add_task':
                taskContext.lastAddedTask = {
                    taskId: result.taskId,
                    title: result.title,
                    timestamp: Date.now()
                };
                break;

            case 'set_task_status':
                taskContext.statusUpdates = taskContext.statusUpdates || [];
                taskContext.statusUpdates.push({
                    taskId: inputData.id,
                    status: inputData.status,
                    timestamp: Date.now()
                });
                break;

            case 'execute_task':
            case 'verify_task':
                taskContext.executionHistory = taskContext.executionHistory || [];
                taskContext.executionHistory.push({
                    operation,
                    result,
                    timestamp: Date.now()
                });
                break;
        }

        await this.storeContext(contextKey, taskContext, {
            type: 'TASK',
            operation,
            tags: ['task', 'workflow']
        });
    }

    /**
     * Update file-related context
     */
    async updateFileContext(operation, inputData, result) {
        const filePath = inputData.file_path || inputData.relative_path || inputData.path;
        if (!filePath) return;

        const contextKey = `file:${filePath}`;
        const existingContext = await this.getContext(contextKey);
        const fileContext = existingContext ? existingContext.value : {};

        fileContext.operations = fileContext.operations || [];
        fileContext.operations.push({
            operation,
            timestamp: Date.now(),
            success: result.success !== false
        });

        // Keep only last 20 operations per file
        if (fileContext.operations.length > 20) {
            fileContext.operations.splice(0, fileContext.operations.length - 20);
        }

        // Store file metadata
        if (operation === 'read_file' && result.content) {
            fileContext.lastReadSize = result.content.length;
            fileContext.lastReadTime = Date.now();
        }

        if (operation === 'write_file') {
            fileContext.lastModified = Date.now();
            fileContext.writeCount = (fileContext.writeCount || 0) + 1;
        }

        await this.storeContext(contextKey, fileContext, {
            type: 'FILE',
            operation,
            tags: ['file', 'io']
        });
    }

    /**
     * Update project-related context
     */
    async updateProjectContext(operation, inputData, result) {
        const existingContext = await this.getContext('project');
        const projectContext = existingContext ? existingContext.value : {};

        projectContext.lastAnalysis = {
            operation,
            result,
            timestamp: Date.now()
        };

        if (operation === 'parse_prd') {
            projectContext.requirements = result;
            projectContext.lastPRDParse = Date.now();
        }

        if (operation === 'analyze_project_complexity') {
            projectContext.complexity = result;
            projectContext.lastComplexityAnalysis = Date.now();
        }

        await this.storeContext('project', projectContext, {
            type: 'PROJECT',
            operation,
            tags: ['project', 'analysis']
        });
    }

    /**
     * Update memory-related context
     */
    async updateMemoryContext(operation, inputData, result) {
        const memoryContext = await this.getContext('memory_operations') || { value: {} };

        memoryContext.value.lastOperation = {
            operation,
            inputData,
            result,
            timestamp: Date.now()
        };

        memoryContext.value.operationCount = (memoryContext.value.operationCount || 0) + 1;

        await this.storeContext('memory_operations', memoryContext.value, {
            type: 'PROJECT',
            operation,
            tags: ['memory', 'knowledge']
        });
    }

    /**
     * Update server-specific context
     */
    async updateServerContext(serverId, operation, result) {
        if (!this.serverContexts.has(serverId)) {
            this.serverContexts.set(serverId, new Map());
        }

        const serverContext = this.serverContexts.get(serverId);
        const contextKey = 'server_state';

        const existingState = serverContext.get(contextKey) || {
            value: {
                operations: [],
                stats: { total: 0, successful: 0, failed: 0 }
            }
        };

        // Add operation to history
        existingState.value.operations.push({
            operation,
            timestamp: Date.now(),
            success: result.success !== false
        });

        // Update statistics
        existingState.value.stats.total++;
        if (result.success !== false) {
            existingState.value.stats.successful++;
        } else {
            existingState.value.stats.failed++;
        }

        // Keep only last 50 operations per server
        if (existingState.value.operations.length > 50) {
            existingState.value.operations.splice(0, existingState.value.operations.length - 50);
        }

        serverContext.set(contextKey, existingState);
    }

    /**
     * Learn context relationships and patterns
     */
    learnContextRelationships(key, contextEntry) {
        const { operation, serverId } = contextEntry.metadata;

        // Track key relationships
        if (!this.contextRelationships.has(key)) {
            this.contextRelationships.set(key, {
                relatedKeys: new Set(),
                operations: new Set(),
                servers: new Set(),
                frequency: 0
            });
        }

        const relationship = this.contextRelationships.get(key);
        relationship.frequency++;

        if (operation) relationship.operations.add(operation);
        if (serverId) relationship.servers.add(serverId);

        // Find related keys based on recent operations
        const recentOperations = this.operationHistory.slice(-10);
        for (const op of recentOperations) {
            if (op.operation === operation) {
                // Find other context keys used in similar operations
                const relatedKeys = this.findKeysInOperationData(op.inputData);
                relatedKeys.forEach(relatedKey => {
                    relationship.relatedKeys.add(relatedKey);
                });
            }
        }

        // Learn patterns
        this.learnContextPattern(key, contextEntry, operation);
    }

    /**
     * Learn context usage patterns
     */
    learnContextPattern(key, contextEntry, operation) {
        const pattern = `${operation}:${contextEntry.metadata.type}`;

        if (!this.contextPatterns.has(pattern)) {
            this.contextPatterns.set(pattern, {
                frequency: 0,
                avgSize: 0,
                keys: new Set(),
                lastUsed: 0
            });
        }

        const patternData = this.contextPatterns.get(pattern);
        patternData.frequency++;
        patternData.keys.add(key);
        patternData.lastUsed = Date.now();

        // Update average size
        const currentAvg = patternData.avgSize;
        const newSize = contextEntry.metadata.size;
        patternData.avgSize = (currentAvg * (patternData.frequency - 1) + newSize) / patternData.frequency;
    }

    /**
     * Get pattern-based context suggestions
     */
    async getPatternContext(operation, data) {
        const suggestions = {};

        // Find patterns that match the current operation
        for (const [pattern, patternData] of this.contextPatterns) {
            if (pattern.startsWith(operation + ':')) {
                suggestions[pattern] = {
                    frequency: patternData.frequency,
                    suggestedKeys: Array.from(patternData.keys).slice(0, 5),
                    avgSize: patternData.avgSize
                };
            }
        }

        return Object.keys(suggestions).length > 0 ? suggestions : null;
    }

    /**
     * Utility methods
     */

    inferContextType(key, value) {
        if (key.startsWith('project')) return 'PROJECT';
        if (key.startsWith('task:')) return 'TASK';
        if (key.startsWith('file:')) return 'FILE';
        if (key.startsWith('user_')) return 'USER_PREFERENCE';
        if (key.startsWith('temp_')) return 'TEMPORARY';

        // Infer from value structure
        if (typeof value === 'object') {
            if (value.taskId || value.tasks) return 'TASK';
            if (value.filePath || value.content) return 'FILE';
        }

        return 'TEMPORARY';
    }

    getTargetServers(contextType) {
        const sharing = this.contextTypes[contextType].sharing;
        return this.serverGroups[sharing] || [];
    }

    async propagateContext(key, contextEntry) {
        const targetServers = this.getTargetServers(contextEntry.metadata.type);

        for (const serverId of targetServers) {
            if (this.serverContexts.has(serverId)) {
                this.serverContexts.get(serverId).set(key, contextEntry);
            }
        }
    }

    isExpired(contextEntry) {
        if (!contextEntry.metadata.ttl) return false;

        const age = Date.now() - contextEntry.metadata.timestamp;
        return age > contextEntry.metadata.ttl;
    }

    recordContextAccess(key, contextEntry) {
        contextEntry.metadata.lastAccessed = Date.now();
        contextEntry.metadata.accessCount = (contextEntry.metadata.accessCount || 0) + 1;
    }

    findKeysInOperationData(data) {
        const keys = [];
        const dataStr = JSON.stringify(data).toLowerCase();

        // Look for common key patterns
        if (dataStr.includes('task')) keys.push('current_task');
        if (dataStr.includes('file') || dataStr.includes('path')) keys.push('current_file');
        if (dataStr.includes('project')) keys.push('project');

        return keys;
    }

    async getOperationContext(operation) {
        const contextKey = `operation:${operation}`;
        const context = await this.getContext(contextKey);
        return context ? context.value : null;
    }

    async getServerContext(serverId) {
        const serverContext = this.serverContexts.get(serverId);
        if (!serverContext) return {};

        const context = {};
        for (const [key, entry] of serverContext) {
            if (!this.isExpired(entry)) {
                context[key] = entry.value;
            }
        }

        return context;
    }

    async compressContext(value) {
        // Simple compression simulation - in real implementation use zlib
        const jsonStr = JSON.stringify(value);
        return `COMPRESSED:${jsonStr.length}:${Buffer.from(jsonStr).toString('base64')}`;
    }

    async decompressContext(compressedValue) {
        if (!compressedValue.startsWith('COMPRESSED:')) {
            return compressedValue;
        }

        const parts = compressedValue.split(':');
        const base64Data = parts[2];
        const jsonStr = Buffer.from(base64Data, 'base64').toString();

        return JSON.parse(jsonStr);
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Persistence methods
     */

    async loadGlobalContext() {
        try {
            const filePath = path.join(this.contextDir, 'global-context.json');
            const data = await fs.readFile(filePath, 'utf8');
            const contexts = JSON.parse(data);

            for (const [key, contextEntry] of Object.entries(contexts)) {
                this.globalContext.set(key, contextEntry);
            }

            console.log(`📁 Loaded ${this.globalContext.size} global context entries`);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.warn(`⚠️ Failed to load global context: ${error.message}`);
            }
        }
    }

    async loadCrossSessionMemory() {
        try {
            const filePath = path.join(this.contextDir, 'cross-session-memory.json');
            const data = await fs.readFile(filePath, 'utf8');
            const memories = JSON.parse(data);

            for (const [key, contextEntry] of Object.entries(memories)) {
                this.crossSessionMemory.set(key, contextEntry);
            }

            console.log(`💾 Loaded ${this.crossSessionMemory.size} cross-session memory entries`);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.warn(`⚠️ Failed to load cross-session memory: ${error.message}`);
            }
        }
    }

    async loadContextPatterns() {
        try {
            const filePath = path.join(this.contextDir, 'context-patterns.json');
            const data = await fs.readFile(filePath, 'utf8');
            const patterns = JSON.parse(data);

            for (const [pattern, patternData] of Object.entries(patterns)) {
                // Convert sets back from arrays
                patternData.keys = new Set(patternData.keys);
                this.contextPatterns.set(pattern, patternData);
            }

            console.log(`🧠 Loaded ${this.contextPatterns.size} context patterns`);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.warn(`⚠️ Failed to load context patterns: ${error.message}`);
            }
        }
    }

    async saveContexts() {
        try {
            // Save global context
            const globalContextObj = Object.fromEntries(this.globalContext);
            await fs.writeFile(
                path.join(this.contextDir, 'global-context.json'),
                JSON.stringify(globalContextObj, null, 2)
            );

            // Save cross-session memory
            const crossSessionObj = Object.fromEntries(this.crossSessionMemory);
            await fs.writeFile(
                path.join(this.contextDir, 'cross-session-memory.json'),
                JSON.stringify(crossSessionObj, null, 2)
            );

            // Save context patterns (convert sets to arrays)
            const patternsObj = {};
            for (const [pattern, patternData] of this.contextPatterns) {
                patternsObj[pattern] = {
                    ...patternData,
                    keys: Array.from(patternData.keys)
                };
            }
            await fs.writeFile(
                path.join(this.contextDir, 'context-patterns.json'),
                JSON.stringify(patternsObj, null, 2)
            );

            // Save current session context
            const sessionContextObj = Object.fromEntries(this.sessionContext);
            await fs.writeFile(
                path.join(this.contextDir, `session-${this.sessionId}.json`),
                JSON.stringify(sessionContextObj, null, 2)
            );

        } catch (error) {
            console.error(`❌ Failed to save contexts: ${error.message}`);
        }
    }

    startAutoSave() {
        setInterval(async () => {
            await this.saveContexts();
        }, 30000); // Save every 30 seconds
    }

    /**
     * Analytics and reporting
     */

    getContextAnalytics() {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        const oneDay = 24 * oneHour;

        const recentOperations = this.operationHistory.filter(op => now - op.timestamp < oneHour);

        return {
            storage: {
                global: this.globalContext.size,
                session: this.sessionContext.size,
                crossSession: this.crossSessionMemory.size,
                serverContexts: Array.from(this.serverContexts.entries()).reduce((acc, [serverId, context]) => {
                    acc[serverId] = context.size;
                    return acc;
                }, {})
            },
            patterns: {
                total: this.contextPatterns.size,
                active: Array.from(this.contextPatterns.values()).filter(p => now - p.lastUsed < oneDay).length
            },
            relationships: this.contextRelationships.size,
            operations: {
                total: this.operationHistory.length,
                lastHour: recentOperations.length
            },
            sessionInfo: {
                sessionId: this.sessionId,
                uptime: now - (this.startTime || now),
                autoSave: this.autoSave
            }
        };
    }

    /**
     * Cleanup and maintenance
     */

    async cleanup() {
        console.log('🧹 Cleaning up expired contexts...');

        let cleaned = 0;

        // Cleanup global context
        for (const [key, entry] of this.globalContext) {
            if (this.isExpired(entry)) {
                this.globalContext.delete(key);
                cleaned++;
            }
        }

        // Cleanup session context
        for (const [key, entry] of this.sessionContext) {
            if (this.isExpired(entry)) {
                this.sessionContext.delete(key);
                cleaned++;
            }
        }

        // Cleanup server contexts
        for (const serverContext of this.serverContexts.values()) {
            for (const [key, entry] of serverContext) {
                if (this.isExpired(entry)) {
                    serverContext.delete(key);
                    cleaned++;
                }
            }
        }

        console.log(`✅ Cleaned up ${cleaned} expired context entries`);

        if (this.autoSave) {
            await this.saveContexts();
        }

        return cleaned;
    }

    async shutdown() {
        console.log('👋 Shutting down Context Persistence...');

        if (this.autoSave) {
            await this.saveContexts();
        }

        this.emit('shutdown');
        console.log('✅ Context Persistence shutdown complete');
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
MCP Context Persistence - Intelligent context management for MCP servers

Usage:
  node mcp-context-persistence.js [command] [options]

Commands:
  start                   Start context persistence service
  analytics               Show context analytics
  cleanup                 Clean up expired contexts
  export <key>            Export specific context
  import <file>           Import context from file

Options:
  --session-id <id>       Specify session ID
  --no-auto-save          Disable auto-save
  --context-dir <path>    Custom context directory
  --help, -h              Show this help message

Examples:
  node mcp-context-persistence.js start                    # Start service
  node mcp-context-persistence.js analytics                # Show analytics
  node mcp-context-persistence.js cleanup                  # Clean expired contexts
        `);
        return;
    }

    const command = args[0] || 'start';
    const contextPersistence = new MCPContextPersistence({
        sessionId: args.includes('--session-id') ?
            args[args.indexOf('--session-id') + 1] : undefined,
        autoSave: !args.includes('--no-auto-save'),
        contextDir: args.includes('--context-dir') ?
            args[args.indexOf('--context-dir') + 1] : undefined
    });

    try {
        switch (command) {
            case 'start':
                await contextPersistence.initialize();
                console.log('\n🌟 Context Persistence is ready!');
                console.log('Use Ctrl+C to shutdown');

                // Keep the process alive
                process.stdin.resume();
                break;

            case 'analytics':
                await contextPersistence.initialize();
                const analytics = contextPersistence.getContextAnalytics();
                console.log('\n📊 Context Analytics:');
                console.log(JSON.stringify(analytics, null, 2));
                break;

            case 'cleanup':
                await contextPersistence.initialize();
                const cleaned = await contextPersistence.cleanup();
                console.log(`✅ Cleanup complete: ${cleaned} expired entries removed`);
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

export default MCPContextPersistence;