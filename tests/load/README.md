# EduAI Ultimate — k6 Load Test Suite

End-to-end load testing for the platform's critical API endpoints using [k6](https://k6.io/).

---

## Prerequisites

### Install k6

**macOS (Homebrew):**
```bash
brew install k6
```

**Ubuntu / Debian:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Docker:**
```bash
docker pull grafana/k6
```

**Verify installation:**
```bash
k6 version
```

---

## Environment Variables

| Variable             | Default                   | Description                                   |
|----------------------|---------------------------|-----------------------------------------------|
| `BASE_URL`           | `http://localhost:3001`   | Base URL of the API server under test         |
| `TENANT_ID`          | `test-tenant`             | Tenant ID sent in `X-Tenant-ID` header        |
| `SEED_USER_EMAIL`    | `seed@test.com`           | Email of the pre-seeded test user             |
| `SEED_USER_PASSWORD` | `Password123!`            | Password of the pre-seeded test user          |

Set them inline with `-e`:
```bash
k6 run -e BASE_URL=https://staging.eduai.example.com \
       -e TENANT_ID=my-tenant \
       -e SEED_USER_EMAIL=admin@myschool.com \
       -e SEED_USER_PASSWORD=securepass \
       tests/load/auth.load.js
```

---

## Running the Tests

All scripts are run from the repository root.

### Auth endpoints (50 VUs, ~3 minutes)
```bash
k6 run tests/load/auth.load.js
```

### Course browsing and enrollment (100 VUs, ~7 minutes)
```bash
k6 run tests/load/courses.load.js
```

### AI endpoints — lower concurrency (10 VUs, ~4 minutes)
```bash
k6 run tests/load/ai.load.js
```

### Billing read endpoints (20 VUs, 2 minutes)
```bash
k6 run tests/load/billing.load.js
```

### Full student journey (20 VUs, ~6 minutes)
```bash
k6 run tests/load/full-journey.load.js
```

---

## Running with External Output

### InfluxDB + Grafana (local)
```bash
k6 run --out influxdb=http://localhost:8086/k6 tests/load/auth.load.js
```

### Prometheus remote write
```bash
k6 run --out experimental-prometheus-rw tests/load/courses.load.js
```

### JSON output for offline analysis
```bash
k6 run --out json=results/auth-$(date +%Y%m%d-%H%M%S).json tests/load/auth.load.js
```

### CSV output
```bash
k6 run --out csv=results/auth.csv tests/load/auth.load.js
```

---

## Interpreting Results

### Key percentile metrics

| Metric | Meaning |
|--------|---------|
| `p(50)` | Median response time — half of requests were faster |
| `p(95)` | 95th percentile — 95% of requests completed within this time; our primary SLO target |
| `p(99)` | 99th percentile — tail latency; 1 in 100 requests was this slow or slower |
| `max`   | Slowest single request observed during the test run |

### Threshold definitions

Each script defines thresholds that must pass for the test to exit with code 0:

```
http_req_duration: p(95)<500   → 95% of requests must complete within 500ms
http_req_duration: p(99)<1000  → 99% of requests must complete within 1000ms
http_req_failed:   rate<0.01   → fewer than 1% of requests may fail (non-2xx or network error)
```

AI endpoints use relaxed thresholds (`p(95)<5000`, `rate<0.05`) because LLM inference is inherently slower and more variable.

### Exit codes

| Code | Meaning |
|------|---------|
| `0`  | All thresholds passed — the test run was successful |
| `99` | One or more thresholds were breached — performance SLO violation |
| `>0` (other) | Script error or network failure |

### Reading the summary table

After each run k6 prints a summary. Key columns:
- **avg** — mean response time
- **min/max** — fastest and slowest requests
- **p(90)/p(95)** — the percentiles that map directly to your thresholds
- **count** — total requests sent during the run
- **rate** — requests per second at steady state

---

## CI Integration

### Smoke test in GitHub Actions

For a quick smoke test (single VU, 1 iteration) that validates endpoints are reachable:
```bash
k6 run --vus 1 --iterations 1 tests/load/auth.load.js
```

### Using `--exit-on-running`

The `--exit-on-running` flag makes k6 exit with code 0 as soon as the test *starts* successfully, without waiting for results. This is useful for fire-and-forget jobs where results are shipped to an external store:
```bash
k6 run --exit-on-running \
       --out influxdb=http://influx:8086/k6 \
       tests/load/full-journey.load.js
```

### Manual dispatch workflow

A GitHub Actions workflow is provided at `.github/workflows/load-test.yml`. It supports:
- `environment` input: `staging` or `production`
- `scenario` input: `auth`, `courses`, `ai`, `billing`, or `full-journey`

Trigger it via:
```bash
gh workflow run load-test.yml \
  -f environment=staging \
  -f scenario=auth
```

---

## Adding New Scenarios

1. Create `tests/load/<name>.load.js`
2. Import shared config from `./config.js`
3. Define `export const options` with stages and thresholds
4. Export a `default function()` that runs VU logic
5. Add the scenario name to the `scenario` input enum in `.github/workflows/load-test.yml`
