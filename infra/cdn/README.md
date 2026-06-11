# CDN Strategy — Tenant Asset Pipeline

This document describes the end-to-end strategy for storing, delivering, and
invalidating per-tenant branding assets (logos, favicons, banners) through a
content delivery network.

---

## Asset Storage (S3)

Tenant assets are stored in an S3-compatible bucket with a predictable path structure:

```
Bucket:  eduai-tenant-assets
Region:  us-east-1 (configurable via AWS_REGION env var)

Path structure:
  /tenants/{tenantId}/logo       — PNG/SVG, max 2 MB
  /tenants/{tenantId}/favicon    — ICO/PNG 32×32, max 256 KB
  /tenants/{tenantId}/banner     — JPEG/PNG/WebP, max 5 MB
```

### Bucket policy

- Public read is **disabled** on the bucket.  All reads go through CloudFront
  with an Origin Access Control (OAC) policy so the bucket is never directly
  reachable from the internet.
- Write access is restricted to the EduAI API service role via an IAM policy.

### Upload flow

1. The tenant admin calls `PUT /storage/upload` with `assetType=logo|favicon|banner`.
2. The Storage module generates a pre-signed S3 PUT URL (TTL 5 minutes).
3. The client uploads the file directly to S3 (bypassing the API server).
4. On success the client calls `PUT /white-label/branding` with the new asset URL.
5. The WhiteLabelService persists the URL and triggers a CloudFront invalidation
   for `/tenants/{tenantId}/*` (see Cache Invalidation below).

---

## CDN Delivery (CloudFront)

A CloudFront distribution serves all tenant assets.

| Setting               | Value                                               |
|-----------------------|-----------------------------------------------------|
| Origin                | S3 bucket `eduai-tenant-assets` (OAC, HTTPS only)  |
| Distribution domain   | `cdn.eduai.example.com`                             |
| HTTPS                 | Required (HTTP redirects to HTTPS)                  |
| HTTP/2 & HTTP/3       | Enabled                                             |
| Compress objects      | Enabled (gzip + Brotli)                             |
| Geo restriction       | None (global delivery)                              |

### Asset URL pattern

```
https://cdn.eduai.example.com/tenants/{tenantId}/{assetType}
```

This URL is constructed by `WhiteLabelService.getAssetUrl()` and the base URL
is configured via the `CDN_BASE_URL` environment variable.

---

## Cache-Control Headers

Versioned assets use immutable caching to maximise CDN hit rates:

```
Cache-Control: public, max-age=31536000, immutable
```

The "version" is implicit — when a tenant uploads a new logo the old object is
replaced in S3 and CloudFront is invalidated (see below).  The frontend always
fetches the latest URL from the API before rendering, so stale browser caches
are not a concern.

For the `GET /white-label/branding/css` endpoint:

```
Cache-Control: public, max-age=3600
```

This gives a 1-hour CDN cache for the dynamically generated CSS.  Branding
updates trigger a cache-busting query param (`?v={timestamp}`) in the HTML `<link>` tag.

---

## Cache Invalidation

When a tenant updates their branding assets, the API triggers a CloudFront
invalidation to flush stale objects:

### Invalidation path

```
/tenants/{tenantId}/*
```

### Implementation

The Storage module or WhiteLabelService calls the AWS SDK after each upload:

```typescript
const client = new CloudFrontClient({ region: 'us-east-1' });
await client.send(new CreateInvalidationCommand({
  DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
  InvalidationBatch: {
    CallerReference: `${tenantId}-${Date.now()}`,
    Paths: {
      Quantity: 1,
      Items: [`/tenants/${tenantId}/*`],
    },
  },
}));
```

CloudFront invalidations typically propagate in under 60 seconds globally.

---

## Custom Domain Routing

EduAI supports two routing modes for tenants:

### 1. Subdomain routing (default)

Every tenant gets a subdomain on the platform domain:

```
{tenantSlug}.eduai.example.com
```

The wildcard Ingress (`infra/k8s/ingress.yaml`) routes `*.eduai.example.com`
to the `eduai-web` service.  The Nginx Ingress passes `X-Tenant-ID` or the
subdomain slug so the Next.js app can resolve the tenant.

The wildcard TLS certificate (`infra/k8s/cert-manager/wildcard-cert.yaml`)
covers all subdomains with a single Let's Encrypt DNS-01 certificate.

### 2. Custom domain (white-label)

Business/Enterprise tenants can map their own domain (e.g. `learn.acme.org`)
to their EduAI instance.

**Provisioning flow:**

1. Tenant admin adds a CNAME DNS record:
   ```
   learn.acme.org  CNAME  ingress.eduai.example.com
   ```
2. Admin calls `POST /white-label/domain/register` with `{ "domain": "learn.acme.org" }`.
3. Admin calls `POST /white-label/domain/validate` to confirm DNS propagation.
   The API checks for a TXT record `eduai-verify={tenantId[0:8]}` — add this
   record to prove domain ownership before registering.
4. Once validated, the platform creates:
   - An Ingress resource (from `infra/k8s/cert-manager/custom-domain-template.yaml`)
   - A Certificate resource — cert-manager provisions a Let's Encrypt TLS cert
     via HTTP-01 challenge.
5. TLS is active within ~60 seconds of DNS propagation.

**DNS requirements for custom domains:**

| Record type | Name                | Value                           |
|-------------|---------------------|---------------------------------|
| CNAME       | `learn.acme.org`    | `ingress.eduai.example.com`     |
| TXT         | `learn.acme.org`    | `eduai-verify={tenantId[0:8]}`  |

---

## Environment Variables

| Variable                      | Description                               | Default                              |
|-------------------------------|-------------------------------------------|--------------------------------------|
| `CDN_BASE_URL`                | CloudFront distribution URL               | `https://cdn.eduai.example.com`      |
| `AWS_S3_BUCKET_ASSETS`        | S3 bucket for tenant assets               | `eduai-tenant-assets`                |
| `CLOUDFRONT_DISTRIBUTION_ID`  | CloudFront distribution ID for invalidation| —                                   |
| `AWS_ACCESS_KEY_ID`           | AWS access key (or use IRSA)              | —                                    |
| `AWS_SECRET_ACCESS_KEY`       | AWS secret key (or use IRSA)              | —                                    |
| `AWS_REGION`                  | AWS region                                | `us-east-1`                          |
