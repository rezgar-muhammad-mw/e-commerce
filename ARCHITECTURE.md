# ShopNx - E-Commerce Application Architecture

## Overview

ShopNx is a full-stack e-commerce application built as an **Nx monorepo** with a **NestJS** backend and **Angular** frontend. The two apps communicate via a RESTful API and share types and constants through a shared library.

```
ecommerce/
├── apps/
│   ├── backend/          # NestJS REST API (port 3000)
│   ├── backend-e2e/      # Backend E2E tests
│   ├── frontend/         # Angular SPA (port 4200)
│   └── frontend-e2e/     # Frontend E2E tests (Playwright)
├── libs/
│   └── shared/           # Shared TypeScript interfaces & constants
├── nx.json               # Nx workspace configuration
├── tsconfig.base.json    # Base TypeScript config
└── package.json          # Root dependencies
```

---

## Shared Library (`libs/shared`)

The shared library acts as the **contract** between frontend and backend. It contains no runtime logic — only TypeScript interfaces and constants.

```
libs/shared/src/lib/
├── types/
│   ├── product.interface.ts    # IProduct, IProductQuery, IPaginatedResponse<T>
│   ├── category.interface.ts   # ICategory
│   ├── user.interface.ts       # IUser, IAuthResponse
│   ├── cart.interface.ts       # ICart, ICartItem
│   └── api-response.interface.ts  # IApiResponse<T>
└── constants/
    └── api-routes.ts           # API_ROUTES constant (all endpoint paths)
```

**Import path:** `@org/shared`

Both apps import from this library to ensure type consistency. The backend entities implement these interfaces, and the frontend services expect API responses shaped by them.

---

## Backend Architecture (`apps/backend`)

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS 11 |
| Database | PostgreSQL 14 |
| ORM | TypeORM |
| Authentication | Passport.js + JWT |
| Validation | class-validator + class-transformer |

### Module Structure

```
apps/backend/src/
├── main.ts                 # Bootstrap, global pipes/interceptors/filters, CORS
├── seed.ts                 # Database seed script
└── app/
    ├── app.module.ts       # Root module (imports all feature modules)
    ├── common/             # Cross-cutting concerns
    │   ├── interceptors/
    │   │   └── transform.interceptor.ts   # Wraps responses in { success, data }
    │   └── filters/
    │       └── http-exception.filter.ts   # Formats errors as { success, message, errors }
    ├── auth/               # Authentication module
    │   ├── auth.module.ts
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── dto/
    │   │   ├── login.dto.ts
    │   │   └── register.dto.ts
    │   ├── strategies/
    │   │   ├── local.strategy.ts     # Email/password validation
    │   │   └── jwt.strategy.ts       # Bearer token validation
    │   └── guards/
    │       ├── local-auth.guard.ts
    │       └── jwt-auth.guard.ts
    ├── users/              # User management
    │   ├── users.module.ts
    │   ├── users.service.ts
    │   └── entities/
    │       └── user.entity.ts
    ├── products/           # Product catalog
    │   ├── products.module.ts
    │   ├── products.controller.ts
    │   ├── products.service.ts
    │   ├── dto/
    │   │   ├── create-product.dto.ts
    │   │   ├── update-product.dto.ts
    │   │   └── query-product.dto.ts
    │   └── entities/
    │       └── product.entity.ts
    ├── categories/         # Product categories
    │   ├── categories.module.ts
    │   ├── categories.controller.ts
    │   ├── categories.service.ts
    │   ├── dto/
    │   │   ├── create-category.dto.ts
    │   │   └── update-category.dto.ts
    │   └── entities/
    │       └── category.entity.ts
    └── cart/               # Shopping cart
        ├── cart.module.ts
        ├── cart.controller.ts
        ├── cart.service.ts
        ├── dto/
        │   ├── add-to-cart.dto.ts
        │   └── update-cart-item.dto.ts
        └── entities/
            ├── cart.entity.ts
            └── cart-item.entity.ts
```

### Database Schema (ERD)

```
┌───────────┐       ┌──────────────┐       ┌───────────┐
│   users   │       │   products   │       │ categories│
├───────────┤       ├──────────────┤       ├───────────┤
│ id (PK)   │       │ id (PK)      │       │ id (PK)   │
│ email     │       │ name         │       │ name      │
│ password  │       │ description  │       │ slug      │
│ firstName │       │ price        │       │ description│
│ lastName  │       │ imageUrl     │       └─────┬─────┘
│ role      │       │ stock        │             │
│ createdAt │       │ categoryId(FK)├─────────────┘
└─────┬─────┘       │ createdAt    │
      │             │ updatedAt    │
      │             └──────┬───────┘
      │                    │
┌─────┴─────┐       ┌──────┴───────┐
│   carts   │       │  cart_items   │
├───────────┤       ├──────────────┤
│ id (PK)   │       │ id (PK)      │
│ userId(FK)│       │ cartId (FK)  │──── carts.id
│ status    │       │ productId(FK)│──── products.id
│ createdAt │       │ quantity     │
└───────────┘       │ price        │  ← snapshot at time of add
                    └──────────────┘
```

**Key relationships:**
- `User` 1→N `Cart` (a user can have multiple carts; only one is `active` at a time)
- `Category` 1→N `Product` (eager-loaded — products always include their category)
- `Cart` 1→N `CartItem` (cascade delete, eager-loaded)
- `CartItem` N→1 `Product` (eager-loaded)

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | - | Register a new user |
| `POST` | `/api/auth/login` | - | Login (returns JWT) |
| `GET` | `/api/auth/profile` | JWT | Get current user profile |
| `GET` | `/api/products` | - | List/search/filter products (paginated) |
| `GET` | `/api/products/:id` | - | Get single product |
| `POST` | `/api/products` | JWT | Create product (admin) |
| `PATCH` | `/api/products/:id` | JWT | Update product (admin) |
| `DELETE` | `/api/products/:id` | JWT | Delete product (admin) |
| `GET` | `/api/categories` | - | List categories (with product count) |
| `GET` | `/api/categories/:id` | - | Get single category |
| `POST` | `/api/categories` | JWT | Create category (admin) |
| `PATCH` | `/api/categories/:id` | JWT | Update category (admin) |
| `DELETE` | `/api/categories/:id` | JWT | Delete category (admin) |
| `GET` | `/api/cart` | JWT | Get current user's cart |
| `POST` | `/api/cart/items` | JWT | Add item to cart |
| `PATCH` | `/api/cart/items/:id` | JWT | Update cart item quantity |
| `DELETE` | `/api/cart/items/:id` | JWT | Remove item from cart |

### Product Search & Filtering

`GET /api/products` accepts these query parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Full-text search on name and description (ILIKE) |
| `categoryId` | number | Filter by category |
| `minPrice` | number | Minimum price filter |
| `maxPrice` | number | Maximum price filter |
| `sortBy` | `price` \| `name` \| `createdAt` | Sort field |
| `sortOrder` | `ASC` \| `DESC` | Sort direction |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 12) |

### Response Format

All API responses are wrapped by the `TransformInterceptor`:

```json
// Success
{
  "success": true,
  "data": { ... }
}

// Error (via HttpExceptionFilter)
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

### Authentication Flow

1. User registers or logs in → backend returns a JWT `accessToken`
2. Frontend stores the token in `localStorage`
3. Every subsequent request includes `Authorization: Bearer <token>` (via HTTP interceptor)
4. Protected endpoints use `JwtAuthGuard` which validates the token via Passport's JWT strategy
5. The JWT payload contains `{ sub: userId, email, role }`

---

## Frontend Architecture (`apps/frontend`)

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Angular 19 (standalone components) |
| State Management | Angular Signals |
| UI Components | Angular Material (Azure Blue theme) |
| Styling | Scoped component CSS |
| Icons | Google Material Icons (web font) |
| HTTP | Angular HttpClient with functional interceptors |
| Routing | Angular Router with lazy-loaded routes |

### Structure

```
apps/frontend/src/
├── main.ts                    # Bootstrap with zone.js
├── styles.css                 # Angular Material theme + global resets
└── app/
    ├── app.ts                 # Root component (navbar + router-outlet + footer)
    ├── app.config.ts          # Providers: router, httpClient, interceptors
    ├── app.routes.ts          # Route definitions (all lazy-loaded)
    ├── core/                  # Singleton services & application-wide concerns
    │   ├── services/
    │   │   ├── api.interceptor.ts    # Adds JWT header + API base URL
    │   │   ├── auth.service.ts       # Login, register, logout
    │   │   ├── product.service.ts    # Product CRUD + search
    │   │   ├── category.service.ts   # Category listing
    │   │   └── cart.service.ts       # Cart operations
    │   ├── guards/
    │   │   └── auth.guard.ts         # Redirects to /login if unauthenticated
    │   └── state/
    │       ├── auth.store.ts         # Signal-based auth state
    │       └── cart.store.ts         # Signal-based cart state
    ├── pages/                 # Route-level components (lazy-loaded)
    │   ├── home/
    │   │   └── home.component.ts           # Hero, categories, featured products
    │   ├── product-list/
    │   │   ├── product-list.component.ts   # Search, filters, pagination
    │   │   └── product-card.component.ts   # Product grid card
    │   ├── product-detail/
    │   │   └── product-detail.component.ts # Detail view, add-to-cart
    │   ├── cart/
    │   │   └── cart.component.ts           # Cart items, quantity edit, totals
    │   ├── login/
    │   │   └── login.component.ts
    │   └── register/
    │       └── register.component.ts
    └── shared/                # Reusable UI components
        └── components/
            ├── navbar.component.ts   # Navigation, auth state, cart badge
            └── footer.component.ts
```

### State Management (Angular Signals)

Instead of NgRx, the app uses lightweight signal-based stores:

```
AuthStore                        CartStore
┌──────────────────────┐        ┌──────────────────────┐
│ _token: Signal       │        │ _cart: Signal<ICart>  │
│ _user: Signal<IUser> │        │                      │
├──────────────────────┤        ├──────────────────────┤
│ token (readonly)     │        │ cart (readonly)       │
│ user (readonly)      │        │ itemCount (computed)  │
│ isAuthenticated      │        │ totalPrice (computed) │
│   (computed)         │        │                      │
├──────────────────────┤        ├──────────────────────┤
│ setAuth(token, user) │        │ setCart(cart)         │
│ clearAuth()          │        │ clearCart()           │
└──────────────────────┘        └──────────────────────┘
```

**Why Signals over NgRx?** For the current scope (auth + cart), full NgRx would add unnecessary boilerplate. Signals provide reactive state with zero setup. If the app grows, these stores can migrate to `@ngrx/signals` with minimal changes.

### Routing

All routes use **lazy loading** via `loadComponent()` for optimal code splitting:

```
/                → HomeComponent
/products        → ProductListComponent
/products/:id    → ProductDetailComponent
/cart            → CartComponent (protected by authGuard)
/login           → LoginComponent
/register        → RegisterComponent
/**              → Redirect to /
```

### HTTP Interceptor

The `apiInterceptor` (functional interceptor) handles two concerns:

1. **Auth header injection** — reads the token from `AuthStore` and adds `Authorization: Bearer <token>` to every request
2. **Base URL prefixing** — prepends `http://localhost:3000` to relative URLs so services only need to reference `/api/...` paths

### Data Flow

```
User Action
    │
    ▼
Page Component ──calls──▶ Service ──HTTP──▶ Backend API
    │                        │                   │
    │                        │                   ▼
    │                        │              Database
    │                        │                   │
    │                    ◀───┘ ◀─── JSON ────────┘
    │
    ├──updates──▶ Signal Store (if stateful: auth/cart)
    │
    └──renders──▶ Template (reads signals reactively)
```

### UI Components

The frontend uses **Angular Material** modules for consistent, accessible UI elements:

- `MatToolbarModule` — top navigation bar
- `MatCardModule` — product cards, detail views
- `MatButtonModule` — all buttons and actions
- `MatIconModule` — Material Icons throughout the UI
- `MatBadgeModule` — cart item count badge
- `MatMenuModule` — user account dropdown
- `MatFormFieldModule` + `MatInputModule` — search bars, login/register forms
- `MatSelectModule` — sort/filter dropdowns
- `MatProgressSpinnerModule` — loading indicators
- `MatChipsModule` — category chips

**Styling approach:** Amazon-inspired design with a dark navbar (`#131921`), amber accent buttons, and component-scoped CSS for layout and spacing. No global utility framework — each component's styles are encapsulated via Angular's `ViewEncapsulation`.

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monorepo tool | Nx | Shared types, unified build/serve, dependency graph |
| ORM | TypeORM | Mature, decorator-based, excellent NestJS integration |
| Auth strategy | JWT (stateless) | No server-side session storage, scales horizontally |
| Frontend state | Angular Signals | Minimal boilerplate for auth + cart scope |
| UI framework | Angular Material + CSS | Pre-built components (toolbar, cards, buttons, form fields, icons, badges, menus, spinners), scoped CSS for layout. No utility framework needed. |
| Component style | Standalone (no NgModules) | Modern Angular best practice, simpler dependency graph |
| Cart price field | Snapshot on CartItem | Product prices can change; cart preserves price at time of add |
| Product→Category | Eager loading | Products are almost always displayed with their category name |
| API response wrapper | Global interceptor | Consistent `{ success, data }` format without per-controller boilerplate |
| Route loading | Lazy `loadComponent()` | Each page is a separate chunk for faster initial load |

---

## Running the Application

```bash
# Prerequisites: PostgreSQL running, database "ecommerce" created

# Start backend (port 3000)
npx nx serve backend

# Seed sample data (18 products, 5 categories, 2 users)
npx nx seed backend

# Start frontend (port 4200)
npx nx serve frontend
```

### Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@shopnx.com | admin123 | Admin |
| customer@shopnx.com | customer123 | Customer |
