# TECH STACK

## 1. Principles
- Bilingual RTL/LTR UX at scale
- Low-bandwidth and mobile-first performance
- Modular services for curriculum, assessment, gamification, and AI
- Strong observability, privacy, and child safety controls

## 2. Recommended Stack

| Layer | Primary Choice | Alternative | Rationale |
|---|---|---|---|
| Frontend Web | Next.js (React, TypeScript) | Nuxt/Vue | SSR/ISR, i18n maturity, ecosystem, performance |
| Design System | Tailwind + component library (Radix/Headless) | MUI | Accessibility and rapid bilingual UI iteration |
| Mobile (future) | React Native (API-first backend) | Flutter | Shared TS talent and API reuse |
| API Gateway | Node.js (NestJS/Fastify) | Go | Structured modular APIs, fast dev velocity |
| AI Services | Python (FastAPI) | Node AI SDK only | Best ecosystem for NLP/ML and model orchestration |
| Relational DB | PostgreSQL | MySQL | Strong relational modeling + JSONB + indexing |
| Cache/Queue | Redis | RabbitMQ/Kafka combo | Caching, sessions, rate limits, lightweight queues |
| Object Storage | S3-compatible (AWS S3/MinIO) | GCS/Azure Blob | Durable media/content storage |
| Search | OpenSearch/Elasticsearch | Postgres FTS (early stage) | Better forum/content/question search at scale |
| Realtime | WebSocket gateway (Socket.IO/ws) | SSE for limited use | Forum, live sessions, collaborative indicators |
| Video | Jitsi/Zoom integration | Daily/Twilio | Tiered tutor/counselor live sessions |
| Auth | OAuth2/OIDC + JWT + refresh | Session-only | Parent/student flows, social login, RBAC |
| CDN | Cloudflare/Akamai | Native cloud CDN | Global edge delivery for static/media |
| CI/CD | GitHub Actions | GitLab CI | Native repo integration |
| IaC | Terraform | Pulumi | Repeatable infra and environment parity |
| Monitoring | OpenTelemetry + Prometheus + Grafana | Datadog/NewRelic | Vendor-neutral traces/metrics/logs |
| Product Analytics | PostHog/Amplitude | Mixpanel | Engagement and learning funnel analysis |

## 3. Frontend Details
- Next.js App Router
- i18n with English + Persian localization files
- RTL/LTR runtime switching and mirrored layouts
- PWA support for offline content bundles
- Accessibility checks in CI (axe, keyboard testing)

## 4. Backend Service Domains
1. Identity & access
2. Curriculum & content delivery
3. Assessment & question bank
4. Gamification & certificates
5. Forum/collaboration
6. Wellbeing/SEL
7. Payments/subscriptions
8. AI/adaptive engine
9. Reporting/analytics

## 5. AI/ML Infrastructure
- Inference service behind policy gateway
- Content generation restricted to staff roles
- Human review queue before student publication
- Feature store for adaptive signals
- Model telemetry: quality, drift, harmful output rates

## 6. Security & Compliance Baseline
- TLS everywhere
- Encryption at rest for DB/object storage
- Secrets manager + key rotation
- RBAC and least privilege
- Audit logs for content, grading, counseling actions
- Data minimization for minors, parental consent workflows

## 7. Deployment Topology (text diagram)
`Edge CDN/WAF -> Web App + API Gateway -> Domain Services -> Data Stores + External Integrations`

## 8. Why this stack fits this project
- Supports bilingual UX + complex pedagogy features
- Supports fast iteration now, scalable architecture later
- Separates AI risk surface from core learner transaction flows
