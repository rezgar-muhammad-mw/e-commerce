# Performance & Scaling Plan — ShopNx

## Context

This plan outlines what should change in ShopNx if stakeholders prioritize **performance** and **scaling** for a high-traffic e-commerce platform. Changes are ordered by impact-to-effort ratio — highest ROI first.

---

## Priority 1: Database (Biggest bottleneck in most apps)

### 1.1 Add Indexes

Currently no custom indexes exist. Every filtered query does a full table scan.

| Table | Column(s) | Why |
|-------|-----------|-----|
| `products` | `categoryId` | Filter by category |
| `products` | `price` | Price range queries |
| `products` | `name, description` (GIN full-text) | Search with `ILIKE` is slow at scale — switch to `tsvector` full-text search |
| `products` | `createdAt` | Sort by newest |
| `carts` | `(userId, status)` | `getOrCreateCart` queries this on every cart operation |
| `cart_items` | `cartId` | Eager-loaded with cart |
| `users` | `email` | Login lookup (unique constraint already creates one) |

### 1.2 Disable `synchronize: true`

Current `app.module.ts` uses `synchronize: true` which auto-alters schema on every boot. In production this is **dangerous** and adds startup latency.

**Change:** Use TypeORM migrations instead.

### 1.3 Connection Pooling

Currently using TypeORM defaults (10 connections). Under load this becomes a bottleneck.

**Change:** Configure pool size based on expected concurrency:
```typescript
TypeOrmModule.forRootAsync({
  useFactory: (config) => ({
    // ...existing config
    extra: {
      max: 20,           // max pool size
      idleTimeoutMillis: 30000,
    },
  }),
})
```

### 1.4 Replace `ILIKE` Search with Full-Text Search

Current product search uses `ILIKE '%term%'` which cannot use indexes and scans every row.

**Change:** Add a `tsvector` column to products and use `ts_query` for search. PostgreSQL full-text search is orders of magnitude faster.

### 1.5 Optimize Eager Loading

Current entities use `eager: true` on multiple relations (Product→Category, Cart→Items→Product). This loads related data even when not needed.

**Change:** Remove `eager: true` from entities. Use explicit `relations: [...]` in queries where needed. This prevents unnecessary JOINs on simple lookups.

---

## Priority 2: Caching

### 2.1 Add Redis

Install Redis and `@nestjs/cache-manager` for application-level caching.

### 2.2 Cache Strategy by Resource

| Resource | Strategy | TTL | Invalidation |
|----------|----------|-----|-------------|
| Categories list | Cache-aside | 1 hour | On create/update/delete |
| Product list (paginated) | Cache-aside (by query hash) | 5 min | On product change |
| Single product | Cache-aside | 10 min | On update/delete |
| Cart | **No cache** | — | Changes too frequently, user-specific |
| JWT validation | Cache user lookup | 5 min | On logout/role change |

### 2.3 HTTP Cache Headers

Add `Cache-Control` headers for public, read-heavy endpoints:

| Endpoint | Header |
|----------|--------|
| `GET /api/categories` | `Cache-Control: public, max-age=3600` |
| `GET /api/products` | `Cache-Control: public, max-age=60` |
| `GET /api/products/:id` | `Cache-Control: public, max-age=300` |
| `GET /api/cart` | `Cache-Control: private, no-cache` |

### 2.4 CDN for Static Assets

Place a CDN (CloudFront, Cloudflare) in front of the Angular app for static asset delivery. Product images (when added) should also go through CDN.

---

## Priority 3: API Performance

### 3.1 Pagination Limits

Current `limit` default is 12 but has no maximum. A client could request `?limit=10000`.

**Change:** Cap `limit` at 100 in `QueryProductDto` with `@Max(100)`.

### 3.2 Response Compression

Enable gzip/brotli compression in NestJS:
```typescript
import compression from 'compression';
app.use(compression());
```

### 3.3 Rate Limiting

Add `@nestjs/throttler` to protect against abuse:

| Endpoint group | Limit |
|----------------|-------|
| Auth (login/register) | 5 req/min per IP |
| Read endpoints | 100 req/min per IP |
| Write endpoints | 30 req/min per user |

### 3.4 Selective Field Loading

Add `select` query support so clients can request only the fields they need. Product list doesn't need `description` — only the detail page does.

---

## Priority 4: Horizontal Scaling

### 4.1 Stateless Backend (Already Done)

JWT auth is already stateless — no server-side sessions. Any instance can handle any request. This is the foundation for horizontal scaling.

### 4.2 Containerization

Dockerize both apps:
```
docker-compose.yml
├── backend (NestJS, multiple replicas)
├── frontend (nginx serving Angular build)
├── postgres (with volume)
└── redis
```

### 4.3 Load Balancer

Put a reverse proxy (nginx, AWS ALB) in front of multiple backend instances. Round-robin or least-connections.

### 4.4 Database Read Replicas

For read-heavy traffic (product browsing), add PostgreSQL read replicas. TypeORM supports this natively:
```typescript
TypeOrmModule.forRoot({
  replication: {
    master: { host: 'master-db', ... },
    slaves: [
      { host: 'replica-1', ... },
      { host: 'replica-2', ... },
    ],
  },
})
```

Write operations (cart, auth) go to master. Read operations (products, categories) go to replicas.

---

## Priority 5: Frontend Performance

### 5.1 Angular SSR (Server-Side Rendering)

Product pages are SEO-critical. Add Angular SSR (`@angular/ssr`) for:
- Faster First Contentful Paint
- SEO (search engines see rendered HTML)
- Social media link previews

### 5.2 Image Optimization

When real product images are added:
- Use `NgOptimizedImage` (already in CLAUDE.md best practices)
- Serve WebP/AVIF formats
- Lazy-load below-the-fold images
- Responsive `srcset` for different screen sizes

### 5.3 Bundle Analysis

Current build shows a 552 KB initial bundle (over the 500 KB budget). Investigate with:
```bash
npx nx build frontend --stats-json
npx webpack-bundle-analyzer dist/apps/frontend/stats.json
```

Likely candidates for reduction:
- Tree-shake unused Material modules
- Defer non-critical Material modules

### 5.4 Service Worker / PWA

Add `@angular/pwa` for:
- Offline capability for browsed products
- Cache API responses for instant back-navigation
- Background sync for cart operations

---

## Priority 6: Monitoring & Observability

You can't optimize what you can't measure.

### 6.1 Application Performance Monitoring (APM)

Add request timing, slow query detection, error tracking:
- **Option A:** OpenTelemetry + Jaeger (self-hosted, free)
- **Option B:** Datadog / New Relic (managed, paid)

### 6.2 Database Query Logging

Enable slow query log in PostgreSQL (`log_min_duration_statement = 200ms`) to identify bottlenecks.

### 6.3 Health Check Endpoint

Add `@nestjs/terminus` with health checks:
- Database connectivity
- Redis connectivity
- Memory usage
- Disk space

### 6.4 Structured Logging

Replace `console.log` in seed.ts with a proper logger (`@nestjs/common Logger` or `pino`). Add request IDs for tracing.

---

## Priority 7: Advanced Scaling (High Traffic)

Only needed at significant scale (thousands of concurrent users).

### 7.1 Message Queue for Async Operations

Add BullMQ (Redis-backed) for:
- Order processing (future feature)
- Email notifications
- Inventory updates after purchase

### 7.2 Database Sharding

If product catalog grows very large, shard by category or price range. Usually PostgreSQL partitioning is sufficient before true sharding.

### 7.3 Microservices Extraction

If the monolith becomes a bottleneck, extract high-traffic domains:

| Service | Why |
|---------|-----|
| Product Catalog | Read-heavy, cacheable, scales independently |
| Cart / Orders | Write-heavy, needs strong consistency |
| Auth | Shared across all services |

**Note:** Only do this when the monolith proves insufficient. Premature microservices add complexity without benefit.

---

## Implementation Roadmap

### Phase 1 — Quick Wins (1-2 days)
- [ ] Add database indexes
- [ ] Disable `synchronize: true`, set up migrations
- [ ] Add `@Max(100)` to pagination limit
- [ ] Enable response compression
- [ ] Add rate limiting

### Phase 2 — Caching Layer (3-5 days)
- [ ] Set up Redis
- [ ] Cache categories and product listings
- [ ] Add HTTP cache headers
- [ ] Replace `ILIKE` with full-text search

### Phase 3 — Infrastructure (1 week)
- [ ] Dockerize the stack
- [ ] Set up load balancer
- [ ] Configure connection pooling
- [ ] Add health checks and monitoring

### Phase 4 — Frontend (1 week)
- [ ] Add Angular SSR
- [ ] Reduce bundle size
- [ ] Image optimization pipeline
- [ ] Service worker / PWA

### Phase 5 — Scale-Out (as needed)
- [ ] Database read replicas
- [ ] Message queue for async ops
- [ ] Evaluate microservices extraction
