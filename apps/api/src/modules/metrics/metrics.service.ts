import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Histogram,
  Gauge,
  register,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: Registry;

  // ── HTTP metrics (populated by middleware) ─────────────────────────────────
  readonly httpRequestsTotal: Counter<string>;
  readonly httpRequestDurationSeconds: Histogram<string>;
  readonly httpRequestSizeBytes: Histogram<string>;
  readonly httpResponseSizeBytes: Histogram<string>;

  // ── Business metrics ──────────────────────────────────────────────────────
  readonly aiCallsTotal: Counter<string>;
  readonly aiCallDurationSeconds: Histogram<string>;
  readonly examsCreatedTotal: Counter<string>;
  readonly examAttemptsTotal: Counter<string>;
  readonly certificatesIssuedTotal: Counter<string>;
  readonly flashcardReviewsTotal: Counter<string>;
  readonly activeWebSocketConnections: Gauge<string>;
  readonly authLoginsTotal: Counter<string>;
  readonly authLoginFailuresTotal: Counter<string>;
  readonly billingEventsTotal: Counter<string>;
  readonly searchQueriesTotal: Counter<string>;
  readonly uploadBytesTotal: Counter<string>;
  readonly queueJobsTotal: Counter<string>;
  readonly queueJobDurationSeconds: Histogram<string>;

  constructor() {
    this.registry = register;

    // Collect default Node.js + process metrics
    collectDefaultMetrics({ register: this.registry, prefix: 'eduai_' });

    // HTTP
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'path', 'status'],
      registers: [this.registry],
    });

    this.httpRequestDurationSeconds = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request latency in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.httpRequestSizeBytes = new Histogram({
      name: 'http_request_size_bytes',
      help: 'HTTP request body size in bytes',
      labelNames: ['method', 'path'],
      buckets: [100, 1000, 10000, 100000, 1000000],
      registers: [this.registry],
    });

    this.httpResponseSizeBytes = new Histogram({
      name: 'http_response_size_bytes',
      help: 'HTTP response body size in bytes',
      labelNames: ['method', 'path'],
      buckets: [100, 1000, 10000, 100000, 1000000],
      registers: [this.registry],
    });

    // AI
    this.aiCallsTotal = new Counter({
      name: 'eduai_ai_calls_total',
      help: 'Total AI API calls',
      labelNames: ['feature', 'model', 'status'],
      registers: [this.registry],
    });

    this.aiCallDurationSeconds = new Histogram({
      name: 'eduai_ai_call_duration_seconds',
      help: 'AI API call latency',
      labelNames: ['feature', 'model'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
      registers: [this.registry],
    });

    // Exams
    this.examsCreatedTotal = new Counter({
      name: 'eduai_exams_created_total',
      help: 'Total exams created',
      labelNames: ['tenant_id', 'difficulty'],
      registers: [this.registry],
    });

    this.examAttemptsTotal = new Counter({
      name: 'eduai_exam_attempts_total',
      help: 'Total exam attempts submitted',
      labelNames: ['tenant_id', 'passed'],
      registers: [this.registry],
    });

    // Certificates
    this.certificatesIssuedTotal = new Counter({
      name: 'eduai_certificates_issued_total',
      help: 'Total certificates issued',
      labelNames: ['tenant_id', 'source'],
      registers: [this.registry],
    });

    // Flashcards
    this.flashcardReviewsTotal = new Counter({
      name: 'eduai_flashcard_reviews_total',
      help: 'Total flashcard SM-2 reviews',
      labelNames: ['rating'],
      registers: [this.registry],
    });

    // WebSockets
    this.activeWebSocketConnections = new Gauge({
      name: 'eduai_active_websocket_connections',
      help: 'Currently active WebSocket connections',
      registers: [this.registry],
    });

    // Auth
    this.authLoginsTotal = new Counter({
      name: 'eduai_auth_logins_total',
      help: 'Total successful logins',
      labelNames: ['method'],
      registers: [this.registry],
    });

    this.authLoginFailuresTotal = new Counter({
      name: 'eduai_auth_login_failures_total',
      help: 'Total failed login attempts',
      labelNames: ['reason'],
      registers: [this.registry],
    });

    // Billing
    this.billingEventsTotal = new Counter({
      name: 'eduai_billing_events_total',
      help: 'Total Stripe webhook events processed',
      labelNames: ['event_type', 'status'],
      registers: [this.registry],
    });

    // Search
    this.searchQueriesTotal = new Counter({
      name: 'eduai_search_queries_total',
      help: 'Total search queries',
      labelNames: ['index', 'has_results'],
      registers: [this.registry],
    });

    // Storage
    this.uploadBytesTotal = new Counter({
      name: 'eduai_upload_bytes_total',
      help: 'Total bytes uploaded',
      labelNames: ['bucket'],
      registers: [this.registry],
    });

    // Queue
    this.queueJobsTotal = new Counter({
      name: 'eduai_queue_jobs_total',
      help: 'Total BullMQ jobs processed',
      labelNames: ['queue', 'status'],
      registers: [this.registry],
    });

    this.queueJobDurationSeconds = new Histogram({
      name: 'eduai_queue_job_duration_seconds',
      help: 'BullMQ job processing duration',
      labelNames: ['queue'],
      buckets: [0.1, 0.5, 1, 5, 10, 30, 60, 120],
      registers: [this.registry],
    });
  }

  async onModuleInit() {
    // noop — metrics registered in constructor
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}
