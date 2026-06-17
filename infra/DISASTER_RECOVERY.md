# EduAI Disaster Recovery Runbook

## RTO / RPO Targets

| Metric | Target |
|--------|--------|
| **RTO** (Recovery Time Objective) | 4 hours — the platform must be fully operational within 4 hours of a declared disaster |
| **RPO** (Recovery Point Objective) | 24 hours — at most 24 hours of data may be lost in a worst-case scenario |

---

## Backup Schedule

| Job | Schedule | Retention | S3 Path |
|-----|----------|-----------|---------|
| PostgreSQL daily | 02:00 UTC every day | 30 days | `backups/postgres/` |
| PostgreSQL weekly | 03:00 UTC every Sunday | 90 days | `backups/postgres/weekly/` |
| Redis daily | 02:30 UTC every day | 7 days | `backups/redis/` |

All backups transition to **S3 Glacier Instant Retrieval** after 30 days.
Cross-region replication is controlled by the `enable_cross_region_replication` Terraform variable.

---

## List Available Backups

```bash
# Daily PostgreSQL backups
aws s3 ls s3://${S3_BUCKET}/backups/postgres/ --recursive

# Weekly PostgreSQL backups
aws s3 ls s3://${S3_BUCKET}/backups/postgres/weekly/ --recursive

# Redis backups
aws s3 ls s3://${S3_BUCKET}/backups/redis/ --recursive
```

Note the full S3 key of the backup file you want to restore (e.g. `backups/postgres/backup_20260101_020000.sql.gz`).

---

## Restore PostgreSQL

> **Warning:** Restoring overwrites the current database. Confirm with the team before proceeding.

### Step 1 — Scale down the API to stop writes

```bash
kubectl scale deployment eduai-api --replicas=0 -n eduai
kubectl scale deployment eduai-worker --replicas=0 -n eduai
```

Wait for pods to terminate:

```bash
kubectl get pods -n eduai -w
```

### Step 2 — Edit the restore job with the target backup file

```bash
kubectl edit job postgres-restore -n eduai
# OR patch the BACKUP_FILE env var directly:
kubectl set env job/postgres-restore \
  BACKUP_FILE="backups/postgres/backup_20260101_020000.sql.gz" \
  -n eduai
```

Alternatively, apply the manifest with the correct `BACKUP_FILE` value set in `infra/k8s/restore-job.yaml`:

```bash
# Edit infra/k8s/restore-job.yaml — replace REPLACE_WITH_S3_PATH with the actual key
kubectl apply -f infra/k8s/restore-job.yaml
```

### Step 3 — Run the restore job

```bash
kubectl create job postgres-restore-$(date +%s) \
  --from=cronjob/postgres-backup \
  -n eduai
```

Monitor progress:

```bash
kubectl logs job/postgres-restore -n eduai -f
```

### Step 4 — Scale the API back up

```bash
kubectl scale deployment eduai-api --replicas=3 -n eduai
kubectl scale deployment eduai-worker --replicas=2 -n eduai
```

---

## Restore Redis

Redis data is ephemeral cache / session state. A clean restart is acceptable in most cases.
Use the RDB snapshot only if session continuity is critical.

### Option A — Clean restart (recommended)

```bash
kubectl rollout restart deployment/redis -n eduai
```

### Option B — Restore from RDB snapshot

```bash
# 1. Download the RDB file from S3
aws s3 cp s3://${S3_BUCKET}/backups/redis/dump_<TIMESTAMP>.rdb /tmp/dump.rdb

# 2. Copy the file into the Redis pod
REDIS_POD=$(kubectl get pod -l app=redis -n eduai -o jsonpath='{.items[0].metadata.name}')
kubectl cp /tmp/dump.rdb eduai/${REDIS_POD}:/data/dump.rdb

# 3. Restart Redis to load the snapshot
kubectl rollout restart deployment/redis -n eduai
```

---

## Verify Restore

### 1. Health check endpoint

```bash
curl -s https://<api-domain>/health | jq .
# Expect: database.status = "up", redis.status = "up", backup.s3_configured = true
```

### 2. Row count spot-checks

```bash
kubectl exec -it deploy/eduai-api -n eduai -- \
  psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;"

kubectl exec -it deploy/eduai-api -n eduai -- \
  psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM tenants;"

kubectl exec -it deploy/eduai-api -n eduai -- \
  psql "$DATABASE_URL" -c "SELECT MAX(created_at) FROM audit_logs;"
```

### 3. Smoke test critical flows

- [ ] Login succeeds (JWT issued)
- [ ] Tenant resolution works (multi-tenant header accepted)
- [ ] Course list returns data
- [ ] File upload reaches S3

---

## Contact Escalation

| Level | Role | Action |
|-------|------|--------|
| 1 | **On-Call Engineer** | First responder. Assess scope, begin restore procedure. |
| 2 | **Engineering Lead** | Escalate if RTO is at risk (>2 hours elapsed). |
| 3 | **CTO** | Escalate if data loss is confirmed or RTO breach is imminent. |
| 4 | **CEO / Legal** | Escalate if a data breach or regulatory notification is required. |

Incident severity definitions:
- **P1** — Full outage or confirmed data loss → wake on-call immediately
- **P2** — Partial outage (subset of tenants affected) → notify within 15 min
- **P3** — Degraded performance, no data loss → notify within 1 hour

---

## Post-Incident Checklist

- [ ] Service restored and verified via health check
- [ ] Row counts and smoke tests passed
- [ ] Incident timeline documented (start, detection, response steps, resolution)
- [ ] Root cause identified
- [ ] Affected tenants notified per SLA requirements
- [ ] Backup schedule confirmed still running (`kubectl get cronjobs -n eduai`)
- [ ] Any failed backup jobs investigated and resolved
- [ ] Post-mortem scheduled within 5 business days
- [ ] Action items created to prevent recurrence
- [ ] Runbook updated if any steps were missing or incorrect
