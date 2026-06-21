"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.startSentry = startSentry;
exports.startTelemetry = startTelemetry;
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
/**
 * Instrumentation bootstrap.
 * Initializes Sentry error tracking and OpenTelemetry tracing.
 * Import this file BEFORE all other imports in main.ts.
 *
 * NOTE: Run `npm install @sentry/node` in apps/api if not yet installed.
 */
/**
 * Initialize Sentry for production error tracking.
 * Must be called before anything else so that all subsequent requires are auto-instrumented.
 */
function startSentry() {
  if (!process.env['SENTRY_DSN'] || process.env['NODE_ENV'] !== 'production') {
    return;
  }
  try {
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn: process.env['SENTRY_DSN'],
      environment: process.env['NODE_ENV'],
      tracesSampleRate: parseFloat(process.env['SENTRY_TRACES_SAMPLE_RATE'] ?? '0.1'),
      // Attach request metadata from Express automatically
      integrations: []
    });
    console.log('[Sentry] Error tracking initialized');
  } catch (err) {
    console.warn('[Sentry] Skipping — @sentry/node not installed or init failed:', err.message);
  }
}
function startTelemetry() {
  if (process.env['OTEL_ENABLED'] !== 'true') {
    return;
  }
  try {
    const {
      NodeSDK
    } = require('@opentelemetry/sdk-node');
    const {
      OTLPTraceExporter
    } = require('@opentelemetry/exporter-trace-otlp-grpc');
    const {
      OTLPMetricExporter
    } = require('@opentelemetry/exporter-metrics-otlp-grpc');
    const {
      PeriodicExportingMetricReader
    } = require('@opentelemetry/sdk-metrics');
    const {
      Resource
    } = require('@opentelemetry/resources');
    const {
      ATTR_SERVICE_NAME,
      ATTR_SERVICE_VERSION
    } = require('@opentelemetry/semantic-conventions');
    const {
      BatchSpanProcessor
    } = require('@opentelemetry/sdk-trace-base');
    const {
      getNodeAutoInstrumentations
    } = require('@opentelemetry/auto-instrumentations-node');
    const {
      W3CTraceContextPropagator,
      CompositePropagator,
      W3CBaggagePropagator
    } = require('@opentelemetry/core');
    const otelEndpoint = process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] ?? 'http://localhost:4317';
    const serviceName = process.env['OTEL_SERVICE_NAME'] ?? 'eduai-api';
    const serviceVersion = process.env['npm_package_version'] ?? '1.0.0';
    const resource = Resource.default().merge(new Resource({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: serviceVersion,
      'deployment.environment': process.env['NODE_ENV'] ?? 'development',
      'service.namespace': 'eduai-ultimate'
    }));
    const sdk = new NodeSDK({
      resource,
      spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter({
        url: `${otelEndpoint}/opentelemetry.proto.collector.trace.v1.TraceService/Export`
      }), {
        maxQueueSize: 1000,
        maxExportBatchSize: 200,
        scheduledDelayMillis: 5000
      }),
      metricReader: new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({
          url: `${otelEndpoint}/opentelemetry.proto.collector.metrics.v1.MetricsService/Export`
        }),
        exportIntervalMillis: 15_000
      }),
      instrumentations: [getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-http': {
          ignoreIncomingRequestHook: req => {
            const url = req.url ?? '';
            return url === '/health' || url.startsWith('/api/v1/health');
          }
        },
        '@opentelemetry/instrumentation-fs': {
          enabled: false
        }
      })],
      textMapPropagator: new CompositePropagator({
        propagators: [new W3CTraceContextPropagator(), new W3CBaggagePropagator()]
      })
    });
    sdk.start();
    process.on('SIGTERM', () => sdk.shutdown().catch(console.error));
    console.log(`[OTel] Telemetry started → ${otelEndpoint} (service: ${serviceName})`);
  } catch (err) {
    console.warn('[OTel] Skipping telemetry — packages not installed or initialization failed:', err.message);
  }
}