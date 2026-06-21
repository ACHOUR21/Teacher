"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MetricsService = void 0;
var _common = require("@nestjs/common");
var _promClient = require("prom-client");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = void 0 && (void 0).__metadata || function (k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
let MetricsService = exports.MetricsService = class MetricsService {
  registry;
  // ── HTTP metrics (populated by middleware) ─────────────────────────────────
  httpRequestsTotal;
  httpRequestDurationSeconds;
  httpRequestSizeBytes;
  httpResponseSizeBytes;
  // ── Business metrics ──────────────────────────────────────────────────────
  aiCallsTotal;
  aiCallDurationSeconds;
  examsCreatedTotal;
  examAttemptsTotal;
  certificatesIssuedTotal;
  flashcardReviewsTotal;
  activeWebSocketConnections;
  authLoginsTotal;
  authLoginFailuresTotal;
  billingEventsTotal;
  searchQueriesTotal;
  uploadBytesTotal;
  queueJobsTotal;
  queueJobDurationSeconds;
  constructor() {
    this.registry = _promClient.register;
    // Collect default Node.js + process metrics
    (0, _promClient.collectDefaultMetrics)({
      register: this.registry,
      prefix: 'eduai_'
    });
    // HTTP
    this.httpRequestsTotal = new _promClient.Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'path', 'status'],
      registers: [this.registry]
    });
    this.httpRequestDurationSeconds = new _promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request latency in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry]
    });
    this.httpRequestSizeBytes = new _promClient.Histogram({
      name: 'http_request_size_bytes',
      help: 'HTTP request body size in bytes',
      labelNames: ['method', 'path'],
      buckets: [100, 1000, 10000, 100000, 1000000],
      registers: [this.registry]
    });
    this.httpResponseSizeBytes = new _promClient.Histogram({
      name: 'http_response_size_bytes',
      help: 'HTTP response body size in bytes',
      labelNames: ['method', 'path'],
      buckets: [100, 1000, 10000, 100000, 1000000],
      registers: [this.registry]
    });
    // AI
    this.aiCallsTotal = new _promClient.Counter({
      name: 'eduai_ai_calls_total',
      help: 'Total AI API calls',
      labelNames: ['feature', 'model', 'status'],
      registers: [this.registry]
    });
    this.aiCallDurationSeconds = new _promClient.Histogram({
      name: 'eduai_ai_call_duration_seconds',
      help: 'AI API call latency',
      labelNames: ['feature', 'model'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
      registers: [this.registry]
    });
    // Exams
    this.examsCreatedTotal = new _promClient.Counter({
      name: 'eduai_exams_created_total',
      help: 'Total exams created',
      labelNames: ['tenant_id', 'difficulty'],
      registers: [this.registry]
    });
    this.examAttemptsTotal = new _promClient.Counter({
      name: 'eduai_exam_attempts_total',
      help: 'Total exam attempts submitted',
      labelNames: ['tenant_id', 'passed'],
      registers: [this.registry]
    });
    // Certificates
    this.certificatesIssuedTotal = new _promClient.Counter({
      name: 'eduai_certificates_issued_total',
      help: 'Total certificates issued',
      labelNames: ['tenant_id', 'source'],
      registers: [this.registry]
    });
    // Flashcards
    this.flashcardReviewsTotal = new _promClient.Counter({
      name: 'eduai_flashcard_reviews_total',
      help: 'Total flashcard SM-2 reviews',
      labelNames: ['rating'],
      registers: [this.registry]
    });
    // WebSockets
    this.activeWebSocketConnections = new _promClient.Gauge({
      name: 'eduai_active_websocket_connections',
      help: 'Currently active WebSocket connections',
      registers: [this.registry]
    });
    // Auth
    this.authLoginsTotal = new _promClient.Counter({
      name: 'eduai_auth_logins_total',
      help: 'Total successful logins',
      labelNames: ['method'],
      registers: [this.registry]
    });
    this.authLoginFailuresTotal = new _promClient.Counter({
      name: 'eduai_auth_login_failures_total',
      help: 'Total failed login attempts',
      labelNames: ['reason'],
      registers: [this.registry]
    });
    // Billing
    this.billingEventsTotal = new _promClient.Counter({
      name: 'eduai_billing_events_total',
      help: 'Total Stripe webhook events processed',
      labelNames: ['event_type', 'status'],
      registers: [this.registry]
    });
    // Search
    this.searchQueriesTotal = new _promClient.Counter({
      name: 'eduai_search_queries_total',
      help: 'Total search queries',
      labelNames: ['index', 'has_results'],
      registers: [this.registry]
    });
    // Storage
    this.uploadBytesTotal = new _promClient.Counter({
      name: 'eduai_upload_bytes_total',
      help: 'Total bytes uploaded',
      labelNames: ['bucket'],
      registers: [this.registry]
    });
    // Queue
    this.queueJobsTotal = new _promClient.Counter({
      name: 'eduai_queue_jobs_total',
      help: 'Total BullMQ jobs processed',
      labelNames: ['queue', 'status'],
      registers: [this.registry]
    });
    this.queueJobDurationSeconds = new _promClient.Histogram({
      name: 'eduai_queue_job_duration_seconds',
      help: 'BullMQ job processing duration',
      labelNames: ['queue'],
      buckets: [0.1, 0.5, 1, 5, 10, 30, 60, 120],
      registers: [this.registry]
    });
  }
  async onModuleInit() {
    // noop — metrics registered in constructor
  }
  async getMetrics() {
    return this.registry.metrics();
  }
  getContentType() {
    return this.registry.contentType;
  }
};
exports.MetricsService = MetricsService = __decorate([(0, _common.Injectable)(), __metadata("design:paramtypes", [])], MetricsService);