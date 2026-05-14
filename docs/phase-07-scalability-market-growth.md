# Phase 7 - Scalability & Market Growth

Phase 7 prepares Gurukool for real users at scale. In plain words: the app can now track release readiness, package itself for Docker/Kubernetes, onboard coaching centers, let institutions host tests, and keep community spaces safer with AI-assisted plus human moderation.

## Implementation Plan

1. Add a PostgreSQL schema for deployment releases, autoscaling profiles, institution partners, hosted institution tests, moderation rules, moderation cases, user reports, and moderator actions.
2. Add a backend `platform` module with authenticated APIs for launch dashboards, institution onboarding, hosted test requests, moderation reporting, and moderator review.
3. Connect the community discussion flow to the moderation classifier so risky posts are queued automatically and high-risk content can be hidden.
4. Add an Ionic Growth page for cross-platform release status, Kubernetes scale targets, institution partnerships, hosted tests, and moderation reports.
5. Add production Dockerfiles, production Compose, and Kubernetes manifests with health checks, resource limits, and horizontal pod autoscaling.
6. Add Phase 7 migration and smoke-test scripts.

## Folder Structure

```text
gurukool/
|-- backend/
|   |-- Dockerfile
|   |-- migrations/
|   |   `-- 010_add_scalability_market_growth.sql
|   `-- src/modules/platform/
|       |-- content-moderation.service.ts
|       |-- platform.controller.ts
|       |-- platform.routes.ts
|       |-- platform.service.ts
|       `-- platform.validators.ts
|-- frontend/
|   |-- Dockerfile
|   |-- nginx.conf
|   `-- src/app/pages/growth/growth.page.ts
|-- k8s/
|   |-- backend-deployment.yaml
|   |-- configmap.yaml
|   |-- frontend-deployment.yaml
|   |-- hpa.yaml
|   |-- ingress.yaml
|   |-- namespace.yaml
|   `-- secrets.example.yaml
|-- ops/
|   |-- build-mobile.ps1
|   |-- phase7-migrate.ps1
|   `-- phase7-smoke.js
`-- docker-compose.prod.yml
```

## Setup Commands

### Local verification

```bash
docker compose up -d
npm --prefix backend run build
npm --prefix backend run migrate
node ops/phase7-smoke.js
npm --prefix frontend run build
```

### Production Docker

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

### Kubernetes

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/ingress.yaml
```

### Android/iOS/PWA

```bash
npm --prefix frontend run build
npm --prefix frontend run cap:sync
npm --prefix frontend run cap:open:android
npm --prefix frontend run cap:open:ios
```

## Code Snippets

### PostgreSQL: deployment releases

```sql
CREATE TABLE IF NOT EXISTS deployment_releases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform deployment_platform NOT NULL,
    release_version VARCHAR(40) NOT NULL,
    status deployment_status NOT NULL DEFAULT 'planned',
    rollout_percent INT NOT NULL DEFAULT 0,
    artifact_url TEXT,
    health_url TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(platform, release_version)
);
```

### Node.js: moderation report API

```ts
router.post('/moderation/report', validate(reportContentSchema), reportContent);

export const reportContent = asyncHandler(async (req, res) => {
  const user = req.user;
  const moderationCase = await platformService.reportContent(user.id, req.body);
  sendCreated(res, 'Content report queued for moderation successfully', moderationCase);
});
```

### Redis: moderation queue

```ts
await redis.rpush(
  'moderation:queue',
  JSON.stringify({
    caseId: row.id,
    contentType: row.content_type,
    severity: row.severity,
    riskScore: Number(row.risk_score ?? 0),
  })
);
await redis.expire('moderation:queue', 7 * 24 * 60 * 60);
```

### Angular: Growth dashboard request

```ts
async getDashboard(): Promise<PlatformDashboard> {
  const response = await firstValueFrom(
    this.http.get<ApiResponse<PlatformDashboard>>(`${this.apiBaseUrl}/platform/dashboard`)
  );
  return response.data!;
}
```

### Kubernetes: autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: gurukool-backend-hpa
spec:
  minReplicas: 2
  maxReplicas: 8
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

## Production-Ready Practices

- Security: all platform APIs require authentication; moderation review is restricted to `admin` and `moderator` roles.
- Privacy: moderation stores short content excerpts, not full conversation dumps, and private contact-sharing is flagged.
- Scalability: Dockerfiles produce deployable images; Kubernetes manifests add probes, resource limits, and HPA autoscaling.
- Reliability: PostgreSQL is the durable source of truth; Redis queues are best-effort accelerators.
- Safety: AI moderation only triages; human reviewers make final action decisions.
- Operations: deployment status, service scale profiles, and hosted institution tests are visible from the Growth page.

## Phase 7 Backend Endpoints

```text
GET   /api/platform/dashboard
GET   /api/platform/deployments
GET   /api/platform/scale-profiles
GET   /api/platform/institutions
POST  /api/platform/institutions
GET   /api/platform/institutions/hosted-tests
POST  /api/platform/institutions/:institutionId/hosted-tests
POST  /api/platform/moderation/report
GET   /api/platform/moderation/queue
PATCH /api/platform/moderation/cases/:caseId/review
```
