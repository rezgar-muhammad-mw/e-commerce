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
│   ├── wishlist.interface.ts   # IWishlist, IWishlistItem
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
    └── wishlist/           # User wishlist
        ├── wishlist.module.ts
        ├── wishlist.controller.ts
        ├── wishlist.service.ts
        ├── dto/
        │   └── add-to-wishlist.dto.ts
        └── entities/
            ├── wishlist.entity.ts
            └── wishlist-item.entity.ts
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
┌─────┴──────────────────────────────────┬────────────────────────┐
│                                        │                        │
┌─────────────┐         ┌──────────────────────┐      ┌───────────────────┐
│   carts     │         │   cart_items   │      │   wishlists    │
├─────────────┤         ├──────────────────────┤      ├───────────────────┤
│ id (PK)     │         │ id (PK)        │      │ id (PK)        │
│ userId (FK) │         │ cartId (FK)    │──┐   │ userId (FK)    │──┐
│ status      │         │ productId (FK) │──┼───│ createdAt      │  │
│ createdAt   │         │ quantity       │  │   └───────────────────┘  │
└─────────────┘         │ price          │  │                          │
                        └──────────────────────┘      ┌──────────────────────────┐
                                                       │   wishlist_items  │
                                                       ├──────────────────────────┤
                                                       │ id (PK)          │
                                                       │ wishlistId (FK)──┘
                                                       │ productId (FK)───────────┘
                                                       │ addedAt          │
                                                       └──────────────────────────┘
```

**Key relationships:**
- `User` 1→N `Cart` (a user can have multiple carts; only one is `active` at a time)
- `User` 1→1 `Wishlist` (one wishlist per user; cascade delete)
- `Wishlist` 1→N `WishlistItem` (cascade delete)
- `WishlistItem` N→1 `Product` (no snapshot — shows current product data)
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
| `GET` | `/api/wishlist` | JWT | Get current user's wishlist |
| `POST` | `/api/wishlist/items` | JWT | Add item to wishlist |
| `DELETE` | `/api/wishlist/items/:id` | JWT | Remove item from wishlist |

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
    │   │   ├── cart.service.ts       # Cart operations
    │   │   └── wishlist.service.ts   # Wishlist operations
    │   ├── guards/
    │   │   └── auth.guard.ts         # Redirects to /login if unauthenticated
    │   └── state/
    │       ├── auth.store.ts         # Signal-based auth state
    │       ├── cart.store.ts         # Signal-based cart state
    │       └── wishlist.store.ts     # Signal-based wishlist state
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
    │   ├── wishlist/
    │   │   └── wishlist.component.ts       # Wishlist items, add-to-cart
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
AuthStore                        CartStore                        WishlistStore
┌──────────────────────┐        ┌──────────────────────┐        ┌──────────────────────┐
│ _token: Signal       │        │ _cart: Signal<ICart>  │        │ _wishlist:           │
│ _user: Signal<IUser> │        │                      │        │   Signal<IWishlist>  │
├──────────────────────┤        ├──────────────────────┤        ├──────────────────────┤
│ token (readonly)     │        │ cart (readonly)       │        │ wishlist (readonly)  │
│ user (readonly)      │        │ itemCount (computed)  │        │ itemCount (computed) │
│ isAuthenticated      │        │ totalPrice (computed) │        │                      │
│   (computed)         │        │                      │        ├──────────────────────┤
├──────────────────────┤        ├──────────────────────┤        │ setWishlist(wishlist)│
│ setAuth(token, user) │        │ setCart(cart)         │        │ addItem(productId)   │
│ clearAuth()          │        │ clearCart()           │        │ removeItem(itemId)   │
└──────────────────────┘        └──────────────────────┘        │ clearWishlist()      │
                                                                  └──────────────────────┘
```

**Why Signals over NgRx?** For the current scope (auth + cart + wishlist), full NgRx would add unnecessary boilerplate. Signals provide reactive state with zero setup. If the app grows, these stores can migrate to `@ngrx/signals` with minimal changes.

### Routing

All routes use **lazy loading** via `loadComponent()` for optimal code splitting:

```
/                → HomeComponent
/products        → ProductListComponent
/products/:id    → ProductDetailComponent
/cart            → CartComponent (protected by authGuard)
/wishlist        → WishlistComponent (protected by authGuard)
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

You are an expert in Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

### Angular Best Practices
- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.
### Accessibility Requirements
- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.
### Components
- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.
### State Management
- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead
### Templates
- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.
### Services
- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

---

## NestJS Best Practices
You are a senior TypeScript programmer with experience in the NestJS framework and a preference for clean programming and design patterns.

Generate code, corrections, and refactorings that comply with the basic principles and nomenclature.

## TypeScript General Guidelines

### Basic Principles

- Use English for all code and documentation.
- Always declare the type of each variable and function (parameters and return value).
  - Avoid using any.
  - Create necessary types.
- Use JSDoc to document public classes and methods.
- Don't leave blank lines within a function.
- One export per file.

### Nomenclature

- Use PascalCase for classes.
- Use camelCase for variables, functions, and methods.
- Use kebab-case for file and directory names.
- Use UPPERCASE for environment variables.
  - Avoid magic numbers and define constants.
- Start each function with a verb.
- Use verbs for boolean variables. Example: isLoading, hasError, canDelete, etc.
- Use complete words instead of abbreviations and correct spelling.
  - Except for standard abbreviations like API, URL, etc.
  - Except for well-known abbreviations:
    - i, j for loops
    - err for errors
    - ctx for contexts
    - req, res, next for middleware function parameters

### Functions

- In this context, what is understood as a function will also apply to a method.
- Write short functions with a single purpose. Less than 20 instructions.
- Name functions with a verb and something else.
  - If it returns a boolean, use isX or hasX, canX, etc.
  - If it doesn't return anything, use executeX or saveX, etc.
- Avoid nesting blocks by:
  - Early checks and returns.
  - Extraction to utility functions.
- Use higher-order functions (map, filter, reduce, etc.) to avoid function nesting.
  - Use arrow functions for simple functions (less than 3 instructions).
  - Use named functions for non-simple functions.
- Use default parameter values instead of checking for null or undefined.
- Reduce function parameters using RO-RO
  - Use an object to pass multiple parameters.
  - Use an object to return results.
  - Declare necessary types for input arguments and output.
- Use a single level of abstraction.

### Data

- Don't abuse primitive types and encapsulate data in composite types.
- Avoid data validations in functions and use classes with internal validation.
- Prefer immutability for data.
  - Use readonly for data that doesn't change.
  - Use as const for literals that don't change.

### Classes

- Follow SOLID principles.
- Prefer composition over inheritance.
- Declare interfaces to define contracts.
- Write small classes with a single purpose.
  - Less than 200 instructions.
  - Less than 10 public methods.
  - Less than 10 properties.

### Exceptions

- Use exceptions to handle errors you don't expect.
- If you catch an exception, it should be to:
  - Fix an expected problem.
  - Add context.
  - Otherwise, use a global handler.

### Testing

- Follow the Arrange-Act-Assert convention for tests.
- Name test variables clearly.
  - Follow the convention: inputX, mockX, actualX, expectedX, etc.
- Write unit tests for each public function.
  - Use test doubles to simulate dependencies.
    - Except for third-party dependencies that are not expensive to execute.
- Write acceptance tests for each module.
  - Follow the Given-When-Then convention.


## Specific to NestJS

### Basic Principles

- Use modular architecture.
- Encapsulate the API in modules.
  - One module per main domain/route.
  - One controller for its route.
    - And other controllers for secondary routes.
  - A models folder with data types.
    - DTOs validated with class-validator for inputs.
    - Declare simple types for outputs.
  - A services module with business logic and persistence.
    - Entities with MikroORM for data persistence.
    - One service per entity.

- Common Module: Create a common module (e.g., @app/common) for shared, reusable code across the application.
  - This module should include:
    - Configs: Global configuration settings.
    - Decorators: Custom decorators for reusability.
    - DTOs: Common data transfer objects.
    - Guards: Guards for role-based or permission-based access control.
    - Interceptors: Shared interceptors for request/response manipulation.
    - Notifications: Modules for handling app-wide notifications.
    - Services: Services that are reusable across modules.
    - Types: Common TypeScript types or interfaces.
    - Utils: Helper functions and utilities.
    - Validators: Custom validators for consistent input validation.

- Core module functionalities:
  - Global filters for exception handling.
  - Global middlewares for request management.
  - Guards for permission management.
  - Interceptors for request processing.

### Testing

- Use the standard Jest framework for testing.
- Write tests for each controller and service.
- Write end to end tests for each api module.
- Add a admin/test method to each controller as a smoke test.


