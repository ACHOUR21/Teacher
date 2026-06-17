# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EduAI Ultimate** is a global AI-powered education SaaS platform at the specification/planning stage. The repository currently contains only `README.md` — a comprehensive blueprint. All implementation work is yet to begin.

The platform combines LMS, School ERP, University ERP, AI Education, Course Marketplace, Live Classroom, Mobile Ecosystem, White Label SaaS, and a Developer Platform. It must support millions of users and enterprise customers in a multi-tenant architecture.

## Intended Tech Stack

**Frontend:** Next.js 15, TypeScript, TailwindCSS, Radix UI, Framer Motion, TanStack Query, Zustand

**Backend:** NestJS, Prisma, PostgreSQL, Redis, Socket.IO, BullMQ

**Search/Storage/AI:** Elasticsearch, S3-compatible storage, OpenAI, Claude (Anthropic), RAG, Vector Database, AI Agents

**Mobile:** Flutter

**Payments:** Stripe, PayPal

**Infrastructure:** Docker, Kubernetes, Terraform, Helm, GitHub Actions

**Monitoring:** Prometheus, Grafana, Loki, OpenTelemetry

## Architecture Principles

All implementation must follow:

- **Domain Driven Design (DDD)** — bounded contexts per module, ubiquitous language
- **Clean Architecture** — domain layer has zero infrastructure dependencies
- **Hexagonal Architecture** — ports & adapters pattern; infrastructure pluggable
- **Event Driven Architecture** — modules communicate via events, not direct calls
- **CQRS** — separate read and write models
- **Modular Monolith** — deployable as one unit today, extractable as microservices later

## Monorepo Structure (to be built)

The deliverable is a monorepo. Recommended layout when scaffolding:

```
apps/
  web/          # Next.js 15 frontend
  api/          # NestJS backend
  mobile/       # Flutter app
packages/
  shared/       # DTOs, types, constants shared across apps
  ui/           # Radix UI + Tailwind component library
  ai/           # AI utilities, RAG, vector DB clients
infra/
  docker/
  k8s/          # Kubernetes manifests
  terraform/
  helm/
.github/
  workflows/    # GitHub Actions CI/CD
```

## Modules

20 platform modules to implement:

1. Multi Tenant SaaS
2. Super Admin
3. School ERP
4. University ERP
5. AI Education Suite
6. Teacher Ecosystem
7. Student Ecosystem
8. Parent Portal
9. Marketplace
10. Live Classroom
11. Certificate System
12. Communication Center
13. Gamification
14. White Label System
15. Billing (Free Trial / Starter / Professional / Business / Enterprise / Lifetime; Stripe + PayPal; coupons, tax, invoices, revenue analytics)
16. Analytics BI
17. Plugin Marketplace
18. API Ecosystem
19. Mobile Apps
20. AI Agents Platform

Each module maps to a NestJS module with its own domain, application, and infrastructure layers.

## AI Modules

17 AI features to implement inside the AI Education Suite and AI Agents Platform:

AI Tutor, AI Homework Assistant, AI Exam Generator, AI Lesson Generator, AI Curriculum Generator, AI Flashcards, AI Mind Maps, AI Research Assistant, AI Translator, AI Speech-to-Text, AI Text-to-Speech, AI Recommendation Engine, AI Career Advisor, AI Performance Prediction, AI Dropout Prediction, AI Content Moderation, AI Plagiarism Detection.

## Security Requirements

Every module must implement: RBAC, ABAC, JWT + Refresh Tokens, MFA/2FA, Device Management, Audit Logs, Encryption at rest and in transit, GDPR, FERPA, COPPA, OWASP compliance.

## Expected Deliverables

When generating implementation, produce: monorepo folder tree, system design docs, Prisma schema (full ERD), NestJS modules with REST + GraphQL + WebSocket, RBAC matrix, frontend architecture, Docker files, Kubernetes manifests, Terraform infrastructure, GitHub Actions CI/CD pipelines, testing strategy, monitoring/logging stack config, environment variable templates, and Swagger/API documentation.

**The specification requires actual implementation-level code** — not summaries. Generate schemas, interfaces, DTOs, services, repositories, modules, workflows, and deployment configurations.

## Development Branch

Active development branch: `claude/claude-md-docs-y0hdj`
