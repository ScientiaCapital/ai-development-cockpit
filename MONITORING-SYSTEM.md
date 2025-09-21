# Production Monitoring System Documentation

## Overview

This document describes the comprehensive monitoring system implemented for the dual-domain LLM platform (SwaggyStacks + ScientiaCapital). The system provides real-time observability, metrics collection, distributed tracing, and centralized logging with organization-specific insights.

## Architecture

### Core Components

1. **Prometheus Metrics Service** (`src/services/monitoring/prometheus.service.ts`)
   - Collects system, API, and business metrics
   - Organization-specific metric tracking
   - Custom metric registration and export

2. **Winston Logging Service** (`src/services/monitoring/logging.service.ts`)
   - Structured logging with multiple specialized loggers
   - Organization context in log entries
   - Multiple output transports (console, file, external)

3. **OpenTelemetry Tracing Service** (`src/services/monitoring/tracing.service.ts`)
   - Distributed tracing across service boundaries
   - Request flow visualization
   - Performance bottleneck identification

4. **Monitoring Integration Service** (`src/services/monitoring/integration.service.ts`)
   - Unified data aggregation from all monitoring sources
   - Dashboard data preparation
   - Health status determination

5. **Central Initialization** (`src/services/monitoring/index.ts`)
   - Singleton pattern for all monitoring services
   - Graceful startup and shutdown handling
   - Configuration management

## Features

### Organization-Specific Monitoring

The system supports dual-domain monitoring for:

- **SwaggyStacks**: Developer-focused metrics with detailed technical insights
- **ScientiaCapital**: Executive-focused metrics with business-oriented dashboards

### Metrics Collection

#### API Metrics
- HTTP request/response times
- Status code distributions
- Endpoint usage patterns
- Error rates and types

#### Business Metrics
- Model inference counts and costs
- User engagement metrics
- Revenue tracking
- Cost optimization indicators

#### System Metrics
- CPU, memory, and GPU utilization
- Database connection health
- Cache performance
- Network throughput

#### Security Metrics
- Authentication failures
- Rate limiting triggers
- API abuse detection
- Access pattern analysis

### Real-time Dashboards

#### Components
- **MonitoringDashboard** (`src/components/monitoring/MonitoringDashboard.tsx`)
  - Organization-themed UI
  - Real-time data updates
  - Alert management
  - Resource utilization displays

#### Hooks
- **useMonitoring** (`src/hooks/useMonitoring.ts`)
  - React hook for monitoring data
  - Auto-refresh capabilities
  - Error handling and recovery

## API Endpoints

### Metrics Exposition
- `GET /api/metrics` - Prometheus-format metrics
- Query parameters: `organization`, `include`, `exclude`

### Dashboard Data
- `GET /api/monitoring/dashboard` - Aggregated dashboard data
- `POST /api/monitoring/dashboard/inference` - Record model inference

### Alerts Management
- `GET /api/monitoring/alerts` - Retrieve alerts
- `POST /api/monitoring/alerts` - Create new alert
- `PUT /api/monitoring/alerts/{id}/resolve` - Resolve alert
- `HEAD /api/monitoring/alerts/summary` - Alert statistics

### Health Checks
- `GET /api/health` - System health status
- Includes monitoring service health

## Configuration

### Environment Variables

```bash
# Logging Configuration
LOG_LEVEL=info                    # Logging verbosity
NODE_ENV=production              # Environment mode

# Monitoring Configuration
PROMETHEUS_PORT=9090             # Prometheus server port
GRAFANA_PORT=3000               # Grafana dashboard port
TRACING_ENDPOINT=localhost:4317  # OpenTelemetry collector

# Organization Configuration
DEFAULT_ORGANIZATION=shared      # Default organization context
```

### Service Configuration

```typescript
// Monitoring initialization
const config: MonitoringConfig = {
  enablePrometheus: true,
  enableTracing: process.env.NODE_ENV === 'production',
  enableIntegration: true,
  logLevel: 'info',
  development: process.env.NODE_ENV === 'development',
};
```

## Usage Examples

### Recording Custom Metrics

```typescript
import { prometheusService } from '@/services/monitoring';

// Record HTTP request
prometheusService.recordHttpRequest(
  'POST',
  '/api/models/deploy',
  200,
  150,
  'swaggystacks'
);

// Record business metric
prometheusService.recordModelInference(
  'qwen2.5:7b',
  120,
  0.001,
  'swaggystacks'
);
```

### Adding Structured Logs

```typescript
import { loggingService } from '@/services/monitoring';

// Performance logging
loggingService.logPerformance('model_inference', {
  modelName: 'deepseek-coder-v2',
  duration: 250,
  organization: 'scientia_capital',
  cost: 0.002
});

// Security logging
loggingService.logSecurity('authentication_failure', {
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
  organization: 'swaggystacks',
  reason: 'invalid_token'
});
```

### Using Tracing

```typescript
import { tracingService } from '@/services/monitoring';

// Trace async operation
const result = await tracingService.traceOperation(
  'deploy_model',
  async () => {
    // Your async operation here
    return await deployModel(modelConfig);
  },
  {
    organization: 'swaggystacks',
    modelName: 'qwen2.5:7b'
  }
);
```

### React Component Integration

```typescript
import { useMonitoring } from '@/hooks/useMonitoring';
import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';

function AppMonitoring() {
  const monitoring = useMonitoring({
    organization: 'swaggystacks',
    refreshInterval: 30000,
    enableRealTime: true
  });

  return (
    <MonitoringDashboard
      organization="swaggystacks"
      className="w-full h-full"
    />
  );
}
```

## Maintenance

### Service Health Monitoring

The monitoring system includes self-monitoring capabilities:

```typescript
import { getMonitoringHealth } from '@/services/monitoring';

const health = getMonitoringHealth();
console.log('Monitoring Health:', health);
// {
//   overall: true,
//   services: {
//     prometheus: true,
//     logging: true,
//     tracing: true,
//     integration: true
//   }
// }
```

### Graceful Shutdown

The system handles graceful shutdown automatically:

```typescript
// Triggered on SIGTERM/SIGINT
process.on('SIGTERM', async () => {
  await shutdownMonitoring();
  process.exit(0);
});
```

### Log Rotation

Logs are automatically rotated based on size and time:

- **Max file size**: 20MB
- **Max files**: 5
- **Rotation**: Daily at midnight
- **Compression**: Gzip for archived logs

## Alerting

### Alert Types

1. **Critical**: System failures, security breaches
2. **Warning**: Performance degradation, high resource usage
3. **Info**: Deployment notifications, configuration changes

### Alert Channels

- **Dashboard**: Real-time alerts in monitoring UI
- **API**: Programmatic alert creation and resolution
- **Webhooks**: Integration with external systems (Slack, PagerDuty)

### Example Alert Creation

```typescript
import { createAlert } from '@/hooks/useMonitoring';

await createAlert({
  alertType: 'high_error_rate',
  severity: 'warning',
  message: 'API error rate exceeded 5% threshold',
  endpointId: 'endpoint-123',
  modelName: 'qwen2.5:7b',
  metadata: {
    errorRate: 0.07,
    threshold: 0.05,
    timeWindow: '5m'
  }
});
```

## Performance Considerations

### Resource Usage

- **Memory**: ~50MB base + metrics storage
- **CPU**: <2% under normal load
- **Network**: Minimal overhead for metric collection
- **Storage**: Log rotation prevents disk space issues

### Optimization

1. **Metric Sampling**: High-frequency metrics use sampling
2. **Async Processing**: Non-blocking metric recording
3. **Batch Operations**: Bulk metric updates for efficiency
4. **Cache Strategy**: Frequent dashboard queries cached

## Troubleshooting

### Common Issues

#### Monitoring Not Initializing

```bash
# Check service status
curl http://localhost:3001/api/health

# Check logs
tail -f logs/monitoring.log

# Restart monitoring
# (handled automatically by application restart)
```

#### Missing Metrics

```typescript
// Verify service registration
console.log(prometheusService.isReady());

// Check metric registration
const metrics = await prometheusService.getMetrics();
console.log(metrics);
```

#### High Memory Usage

```bash
# Monitor metric cardinality
curl http://localhost:3001/api/metrics | grep -c "^[a-zA-Z]"

# Check for metric leaks
curl http://localhost:3001/api/monitoring/dashboard?organization=shared
```

### Debug Mode

Enable debug logging for troubleshooting:

```bash
LOG_LEVEL=debug npm run dev
```

## Integration with External Systems

### Grafana Setup

1. **Data Source Configuration**:
   ```yaml
   apiVersion: 1
   datasources:
     - name: Prometheus
       type: prometheus
       url: http://localhost:9090
       access: proxy
   ```

2. **Dashboard Import**: Use provided Grafana dashboard templates in `/monitoring/grafana/`

### Prometheus Configuration

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'ai-development-cockpit'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/api/metrics'
    scrape_interval: 10s
```

## Security

### Data Protection

- **Sensitive Data**: Automatically scrubbed from logs
- **API Keys**: Redacted in tracing and logging
- **User Data**: Minimal PII in monitoring data

### Access Control

- **Organization Isolation**: Metrics segregated by organization
- **API Security**: Monitoring endpoints require authentication
- **Audit Trail**: All monitoring access logged

## Future Enhancements

### Planned Features

1. **Advanced Analytics**: ML-based anomaly detection
2. **Custom Dashboards**: User-configurable monitoring views
3. **Mobile App**: Dedicated monitoring mobile application
4. **AI Insights**: Automated performance recommendations

### Scaling Considerations

1. **Horizontal Scaling**: Multiple monitoring instances
2. **Data Retention**: Configurable metric retention policies
3. **External Storage**: Integration with time-series databases
4. **Federation**: Multi-region monitoring aggregation

## Conclusion

The production monitoring system provides comprehensive observability for the dual-domain LLM platform. It enables proactive issue detection, performance optimization, and business intelligence through organization-specific metrics and dashboards.

For support or questions, refer to the implementation files in `src/services/monitoring/` or contact the infrastructure team.