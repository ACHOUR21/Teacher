# EduAI Ultimate — System Design

## 1. Architecture Overview

EduAI Ultimate is built as a **Modular Monolith** following **Domain-Driven Design**, **Clean Architecture**, **Hexagonal Architecture**, **CQRS**, and **Event-Driven Architecture** principles. The codebase can be deployed as a single unit today and extracted into microservices without code changes.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
│  Next.js 15 Web App  │  Flutter Mobile  │  Third-party API     │
└────────────┬─────────────────┬──────────────────┬──────────────┘
             │                 │                  │
             ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Gateway / NestJS                        │
│  REST (api/v1)  │  WebSocket (Socket.IO)  │  Swagger /api/docs  │
│                                                                 │
│  TenantMiddleware → JwtAuthGuard → RolesGuard → Controllers    │
└────────────────────────────┬────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                   ▼
┌─────────────────┐ ┌──────────────────┐ ┌────────────────────┐
│  Application    │ │   Domain Layer   │ │  Infrastructure    │
│  Services       │ │   (Entities,     │ │  (Prisma ORM,      │
│  (Use Cases,    │ │   Value Objects, │ │   Redis, S3,       │
│   DTOs, CQRS)   │ │   Domain Events) │ │   Elasticsearch,   │
└─────────────────┘ └──────────────────┘ │   BullMQ, SMTP)    │
                                          └────────────────────┘
```

## 2. Multi-Tenancy

Every request is scoped to a tenant resolved by `TenantMiddleware`:

1. **Header**: `X-Tenant-ID: <uuid>` (API and mobile clients)
2. **Subdomain**: `<slug>.eduai.app` (web app)
3. **Domain**: custom domain lookup via WhiteLabel settings

All Prisma queries include `tenantId` in the `where` clause. The JWT payload carries `tenantId` and `userId`; the `TenantGuard` verifies the request header matches the token.

## 3. Module Breakdown

| Module | NestJS Module | Key Entities | Ports |
|--------|--------------|--------------|-------|
| Multi-Tenant SaaS | TenantsModule | Tenant, WhiteLabel | REST |
| Super Admin | UsersModule | User, AuditLog | REST |
| School ERP | SchoolErpModule | School, Department, Class, Timetable | REST |
| University ERP | UniversityErpModule | University, Faculty, Program, Enrollment | REST |
| AI Education Suite | AiModule | AIConversation, AIMessage, AIUsage | REST |
| AI Agents Platform | AiAgentsModule | AIConversation (agentType) | REST |
| Teacher Ecosystem | TeachersModule | Teacher, Course, Review | REST |
| Student Ecosystem | StudentsModule | Student, CourseProgress, Submission | REST |
| Parent Portal | ParentsModule | Parent, ParentStudent | REST |
| Marketplace | MarketplaceModule | Course, Enrollment, Review | REST |
| Live Classroom | LiveModule | LiveSession, LiveParticipant | REST + WS |
| Certificate System | CertificatesModule | Certificate, CertificateTemplate | REST |
| Communication Center | MessagingModule | Conversation, Message | REST + WS |
| Gamification | GamificationModule | UserPoints, Achievement, Leaderboard | REST |
| White Label System | WhiteLabelModule | WhiteLabel | REST |
| Billing | BillingModule | Subscription, Invoice, Coupon | REST |
| Analytics BI | AnalyticsModule | AIUsage, aggregated views | REST |
| Plugin Marketplace | PluginsModule | Plugin, InstalledPlugin | REST |
| API Ecosystem | ApiEcosystemModule | ApiKey, WebhookEndpoint | REST |
| Mobile Apps | — (Flutter client) | — | — |

## 4. Data Flow

### Authentication Flow

```
Client → POST /api/v1/auth/register
  → AuthService.createTenantAndAdmin()
    → PrismaService: create Tenant + User (bcrypt password)
    → JwtService: sign accessToken (15m) + refreshToken (7d)
    → UserSession: persist refresh token
  ← 201 { tokens: { accessToken, refreshToken }, user }

Client → POST /api/v1/auth/login (X-Tenant-ID header)
  → AuthService.login()
    → PrismaService: findUser by email + tenantId
    → bcrypt.compare(password, user.passwordHash)
    → JwtService: sign tokens
  ← 200 { tokens }

Protected Request → GET /api/v1/users/me
  → JwtAuthGuard: verify JWT, extract { userId, tenantId, role }
  → TenantGuard: verify X-Tenant-ID matches token.tenantId
  → UsersService.findById()
  ← 200 { user }
```

### AI Agents Agentic Loop

```
Client → POST /api/v1/ai/agents/chat
  { agentType: 'STUDY_PLANNER', message: '...', sessionId?: '...' }
  → AiAgentsService.chat()
    1. Resolve or create AIConversation
    2. Append user message to history
    3. anthropic.messages.create({ model: 'claude-opus-4-8', tools, messages })
    4. If response.content[i].type === 'tool_use':
         → executeTool(toolName, input, userId, tenantId)
         → Append tool_result to messages
         → Loop: anthropic.messages.create() again
    5. Extract final text response
    6. Persist AIMessage records
    7. Update AIConversation.updatedAt
  ← 200 { response, sessionId, usage }
```

## 5. Security Architecture

```
Request
  → helmet() (CSP, HSTS, XSS protection)
  → compression()
  → CORS whitelist (tenant domains + *.eduai.app)
  → TenantMiddleware (resolve tenantId)
  → JwtAuthGuard (verify RS256/HS256 JWT)
  → TenantGuard (header ↔ token cross-check)
  → RolesGuard (@Roles decorator)
  → ABAC ownership check (in service layer)
  → ValidationPipe (DTO whitelist + transform)
  → Controller → Service
  → AuditService.log() (action, before/after snapshots)
```

### RBAC Roles

| Role | Scope |
|------|-------|
| `SUPER_ADMIN` | Cross-tenant; full platform access |
| `ADMIN` | Single tenant; manage users, courses, billing |
| `SCHOOL_ADMIN` | School ERP management within tenant |
| `UNIVERSITY_ADMIN` | University ERP management within tenant |
| `TEACHER` | Own courses, live sessions, grading |
| `STUDENT` | Enrolled courses, own progress |
| `PARENT` | Linked children's data only |

See `docs/rbac-matrix.md` for the full permission matrix.

## 6. Caching Strategy

| Data | Cache Key Pattern | TTL |
|------|-------------------|-----|
| Platform analytics | `analytics:platform:{tenantId}` | 5 min |
| Tenant details | `tenant:{id}:full` | 5 min |
| Tenant stats | `tenant:{id}:stats` | 1 min |
| User profile | `user:{id}:profile` | 5 min |
| White-label settings | `white-label:{tenantId}` | 10 min |
| Gamification leaderboard | `gamification:leaderboard:{tenantId}` | 1 min |

Cache invalidation: explicit `del()` / `delPattern()` on write operations.

## 7. Event-Driven Communication

Modules publish domain events via BullMQ queues rather than calling each other directly:

| Event | Producer | Consumer |
|-------|----------|----------|
| `course.enrolled` | MarketplaceModule | GamificationModule, NotificationsModule |
| `lesson.completed` | CoursesModule | GamificationModule, CertificatesModule |
| `quiz.submitted` | CoursesModule | GamificationModule, AnalyticsModule |
| `live.session.ended` | LiveModule | NotificationsModule, AnalyticsModule |
| `payment.completed` | BillingModule | NotificationsModule, AnalyticsModule |
| `certificate.issued` | CertificatesModule | NotificationsModule |

## 8. WebSocket Architecture (Live Classroom)

```
Client                          Server (Socket.IO)
  │                                    │
  ├── emit('join-session', {id})  ─────▶ socket.join(`session:${id}`)
  │                                    │  verifyParticipant(socket.userId, id)
  │                                    │
  ├── emit('offer', {sdp})        ─────▶ to(`session:${id}`).emit('offer', sdp)
  │                                    │
  │◀──── emit('participant-joined') ───┤ broadcast to room
  │                                    │
  ├── emit('chat-message', {text}) ────▶ save to DB; broadcast to room
  │                                    │
  ├── emit('leave-session', {id}) ─────▶ socket.leave(`session:${id}`)
  │                                    │  update LIveParticipant.leftAt
```

## 9. Storage Architecture

Files are stored in S3-compatible object storage (AWS S3 in production, MinIO in development):

```
Bucket: eduai-{env}
  ├── avatars/{uuid}.jpg
  ├── course-thumbnails/{uuid}.jpg
  ├── lesson-videos/{uuid}.mp4
  ├── attachments/{uuid}.pdf
  ├── certificates/{tenantId}/{certificateId}.pdf
  └── plugins/{pluginId}/assets/
```

PDFs (certificates, invoices) are generated server-side with PDFKit and streamed directly to S3.

## 10. AI Architecture

### AI Education Suite (17 features)

All features use `AiService` which wraps both Anthropic and OpenAI SDKs:
- **Primary model**: `claude-opus-4-8` for reasoning-heavy tasks (exam generation, tutoring)
- **Fast model**: `gpt-4o` for translation, TTS orchestration
- Conversations persisted in `AIConversation` / `AIMessage` tables
- Token usage tracked per tenant in `AIUsage` for billing analytics

### AI Agents Platform (5 agents)

Each agent has a specialized `systemPrompt` + a typed Anthropic `tools` array:

| Agent | Tools |
|-------|-------|
| Study Planner | `get_student_schedule`, `create_study_plan` |
| Homework Assistant | `search_knowledge_base` |
| Research Assistant | `search_academic_sources`, `summarize_document` |
| Career Advisor | `get_career_data`, `search_job_market` |
| Performance Coach | `get_performance_data`, `set_learning_goals` |

The agentic loop handles `tool_use` blocks by executing real DB queries and feeding `tool_result` content back until the model returns a final `text` block.

## 11. Infrastructure

### Docker Compose (Development)

```yaml
services:
  api:        # NestJS app
  web:        # Next.js app
  postgres:   # PostgreSQL 16
  redis:      # Redis 7
  minio:      # S3-compatible object storage
  elasticsearch: # Search
  mailhog:    # Email testing
```

### Kubernetes (Production)

```
Namespace: eduai-prod
  Deployments:
    - api (HPA: 3-20 replicas, CPU 70%)
    - web (HPA: 2-10 replicas)
  Services: api-svc (ClusterIP), web-svc (ClusterIP)
  Ingress: nginx-ingress → api/web by path
  ConfigMap: app-config (non-secret env vars)
  Secret: app-secrets (JWT keys, DB URL, API keys)
  PersistentVolumeClaim: (none — stateless; state in RDS/ElastiCache/S3)
```

### Terraform Modules

| Module | Resources |
|--------|-----------|
| `infra/terraform/modules/eks` | EKS cluster, node groups |
| `infra/terraform/modules/rds` | Aurora PostgreSQL (Multi-AZ) |
| `infra/terraform/modules/elasticache` | Redis cluster |
| `infra/terraform/modules/s3` | S3 bucket + CloudFront |
| `infra/terraform/modules/opensearch` | OpenSearch domain |

## 12. CI/CD Pipelines

| Workflow | Trigger | Steps |
|----------|---------|-------|
| `ci.yml` | PR / push to any branch | lint, typecheck, unit tests, build |
| `cd-staging.yml` | push to `main` | ci + docker build + push ECR + helm upgrade staging |
| `cd-production.yml` | tag `v*` | ci + docker build + push ECR + helm upgrade production |

## 13. Observability

```
App → OpenTelemetry SDK → OTEL Collector
  ├── Traces ──────────────────────▶ Tempo / Jaeger
  ├── Metrics ─────────────────────▶ Prometheus → Grafana
  └── Logs ────────────────────────▶ Loki → Grafana

Alerting:
  - ErrorRate > 1% for 5m → PagerDuty
  - P95 latency > 2s → Slack
  - Pod crash loop → PagerDuty
```

## 14. Database Schema Highlights

Key relationships (see Prisma schema for full ERD):

```
Tenant ─── User ─── Teacher ─── Course ─── Section ─── Lesson
                 └── Student ─── CourseProgress
                 └── Parent ─── ParentStudent ─── Student
Tenant ─── School ─── Department ─── SchoolClass
Tenant ─── University ─── Faculty
                       └── AcademicProgram ─── Enrollment ─── Student
Tenant ─── Subscription ─── Invoice
Tenant ─── WhiteLabel
Tenant ─── Plugin (InstalledPlugin join table)
User ─── AIConversation ─── AIMessage
User ─── UserPoints ─── UserAchievement ─── Achievement
```
