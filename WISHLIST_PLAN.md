# Wishlist Feature - Architecture Plan

## Overview

Add a **Wishlist** feature that lets authenticated users save products they're interested in. The wishlist is persisted in the database per user (survives across sessions). Users can add/remove products and move items to their cart.

The backend follows **Clean Architecture** with the **Repository Pattern**, separating domain logic from infrastructure concerns.

---

## Scope

| In Scope | Out of Scope |
|----------|-------------|
| Add/remove products to wishlist | Multiple wishlists per user |
| View wishlist page | Sharing wishlists publicly |
| "Move to Cart" action | Wishlist sorting/reordering |
| Heart icon toggle on product cards/detail | Price drop notifications |
| Wishlist item count in navbar | Guest (unauthenticated) wishlist |

---

## Shared Library Changes (`libs/shared`)

### New file: `types/wishlist.interface.ts`

```typescript
export interface IWishlistItem {
  id: number;
  productId: number;
  product?: IProduct;
  addedAt: string;
}

export interface IWishlist {
  id: number;
  userId: number;
  items: IWishlistItem[];
}
```

### Update: `constants/api-routes.ts`

```typescript
WISHLIST: {
  BASE: '/api/wishlist',
  ITEMS: '/api/wishlist/items',
  ITEM: (id: number) => `/api/wishlist/items/${id}`,
}
```

---

## Backend Architecture — Clean Architecture + Repository Pattern

### Layer Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  Presentation Layer (Controller)                                │
│  wishlist.controller.ts — HTTP concerns, validation, guards     │
├─────────────────────────────────────────────────────────────────┤
│  Application Layer (Use Cases / Service)                        │
│  wishlist.service.ts — orchestrates business logic              │
│  dto/ — input validation (AddToWishlistDto)                     │
├─────────────────────────────────────────────────────────────────┤
│  Domain Layer (Entities + Repository Interfaces)                │
│  entities/ — Wishlist, WishlistItem (domain models)             │
│  repositories/ — IWishlistRepository, IWishlistItemRepository   │
├─────────────────────────────────────────────────────────────────┤
│  Infrastructure Layer (Repository Implementations)              │
│  repositories/ — TypeORM implementations of domain interfaces   │
└─────────────────────────────────────────────────────────────────┘
```

**Dependency Rule:** Dependencies point inward. The service depends on repository *interfaces*, never on TypeORM directly. The infrastructure layer implements those interfaces.

### Module Structure

```
app/wishlist/
├── wishlist.module.ts
├── wishlist.controller.ts              # Presentation layer
├── wishlist.service.ts                 # Application layer (use cases)
├── dto/
│   └── add-to-wishlist.dto.ts          # Input validation
├── domain/
│   ├── entities/
│   │   ├── wishlist.entity.ts          # TypeORM entity + domain model
│   │   └── wishlist-item.entity.ts     # TypeORM entity + domain model
│   └── repositories/
│       ├── wishlist.repository.interface.ts       # Abstract contract
│       └── wishlist-item.repository.interface.ts  # Abstract contract
└── infrastructure/
    └── repositories/
        ├── wishlist.repository.ts          # TypeORM implementation
        └── wishlist-item.repository.ts     # TypeORM implementation
```

### Database Schema

```
┌──────────────┐       ┌───────────────────┐
│  wishlists   │       │  wishlist_items    │
├──────────────┤       ├───────────────────┤
│ id (PK)      │       │ id (PK)           │
│ userId (FK)  │───┐   │ wishlistId (FK)   │──── wishlists.id (CASCADE)
│ createdAt    │   └──▶│ productId (FK)    │──── products.id
└──────────────┘       │ addedAt           │
                       └───────────────────┘
```

**Key differences from Cart:**
- No `quantity` field (wishlist is binary: saved or not)
- No `price` snapshot (wishlist shows current price)
- No `status` field (single wishlist per user, no workflow)
- Unique constraint on `(wishlistId, productId)` to prevent duplicates

### Repository Interfaces (Domain Layer)

```typescript
// domain/repositories/wishlist.repository.interface.ts
export abstract class IWishlistRepository {
  abstract findByUserId(userId: number): Promise<Wishlist | null>;
  abstract create(userId: number): Promise<Wishlist>;
  abstract save(wishlist: Wishlist): Promise<Wishlist>;
}

// domain/repositories/wishlist-item.repository.interface.ts
export abstract class IWishlistItemRepository {
  abstract findByWishlistAndProduct(wishlistId: number, productId: number): Promise<WishlistItem | null>;
  abstract create(wishlistId: number, productId: number): Promise<WishlistItem>;
  abstract remove(item: WishlistItem): Promise<void>;
  abstract findByIdAndWishlist(itemId: number, wishlistId: number): Promise<WishlistItem | null>;
}
```

> **Why abstract classes instead of TypeScript interfaces?** NestJS DI uses runtime tokens. Abstract classes serve as both the type contract and the injection token — no separate `@Inject('TOKEN')` needed.

### Repository Implementations (Infrastructure Layer)

```typescript
// infrastructure/repositories/wishlist.repository.ts
@Injectable()
export class WishlistRepository extends IWishlistRepository {
  constructor(
    @InjectRepository(Wishlist)
    private readonly repo: Repository<Wishlist>,
  ) { super(); }

  findByUserId(userId: number): Promise<Wishlist | null> { ... }
  create(userId: number): Promise<Wishlist> { ... }
  save(wishlist: Wishlist): Promise<Wishlist> { ... }
}
```

### Service (Application Layer)

The service depends only on repository interfaces — no direct TypeORM usage:

```typescript
@Injectable()
export class WishlistService {
  constructor(
    private readonly wishlistRepo: IWishlistRepository,
    private readonly wishlistItemRepo: IWishlistItemRepository,
  ) {}

  async getWishlist(userId: number): Promise<IWishlist> { ... }
  async addItem(userId: number, productId: number): Promise<IWishlist> { ... }
  async removeItem(userId: number, itemId: number): Promise<IWishlist> { ... }
}
```

**Business rules in the service:**
- Auto-create wishlist on first access (get-or-create pattern)
- Duplicate-safe: adding an already-wishlisted product is a no-op
- Ownership check: users can only remove their own wishlist items

### Controller (Presentation Layer)

```typescript
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()           getWishlist(@Request() req)
  @Post('items')   addItem(@Request() req, @Body() dto: AddToWishlistDto)
  @Delete('items/:id')  removeItem(@Request() req, @Param('id') id: number)
}
```

### Module Wiring

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Wishlist, WishlistItem, Product])],
  controllers: [WishlistController],
  providers: [
    WishlistService,
    { provide: IWishlistRepository, useClass: WishlistRepository },
    { provide: IWishlistItemRepository, useClass: WishlistItemRepository },
  ],
  exports: [WishlistService],
})
export class WishlistModule {}
```

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/wishlist` | JWT | Get user's wishlist with product details |
| `POST` | `/api/wishlist/items` | JWT | Add product to wishlist |
| `DELETE` | `/api/wishlist/items/:id` | JWT | Remove item from wishlist |

---

## Frontend Changes (`apps/frontend`)

> Follows Angular best practices from CLAUDE.md: standalone components, `OnPush`, signals, `input()`/`output()`, `@if`/`@for` control flow, `takeUntilDestroyed()`, separate HTML/SCSS/spec files, reactive forms where applicable.

### New files

```
app/
├── core/
│   ├── services/
│   │   └── wishlist.service.ts      # HTTP calls + store updates
│   └── state/
│       └── wishlist.store.ts        # Signal-based state (providedIn: 'root')
└── pages/
    └── wishlist/
        ├── wishlist.component.ts
        ├── wishlist.component.html
        ├── wishlist.component.scss
        └── wishlist.component.spec.ts
```

### WishlistStore (signal-based)

```
WishlistStore
┌──────────────────────────┐
│ _wishlist: Signal<IWishlist | null>
├──────────────────────────┤
│ wishlist (readonly)       │
│ itemCount (computed)      │
│ isInWishlist(productId)   │  ← used by heart icon toggle
├──────────────────────────┤
│ setWishlist(wishlist)     │
│ clearWishlist()           │
└──────────────────────────┘
```

### WishlistService

```
WishlistService (providedIn: 'root')
├── loadWishlist()             → GET /api/wishlist, updates store
├── addItem(productId)         → POST /api/wishlist/items, updates store
├── removeItem(itemId)         → DELETE /api/wishlist/items/:id, updates store
└── toggleItem(productId)      → add or remove based on current state
```

### Route

```
/wishlist → WishlistComponent (lazy-loaded, authGuard protected)
```

### UI Changes to Existing Components

#### Navbar (`shared/components/navbar.component`)
- Add `favorite` icon with badge (wishlist item count) next to cart icon

#### ProductCardComponent (`pages/product-list/product-card.component`)
- Add heart icon overlay (top-right of image) to toggle wishlist
- `favorite` (filled) = in wishlist, `favorite_border` (outlined) = not
- Uses `class` binding (not `ngClass`) per CLAUDE.md

#### ProductDetailComponent (`pages/product-detail/product-detail.component`)
- Add "Add to Wishlist" / "Remove from Wishlist" button in buy-box

#### WishlistComponent (new page)
- `changeDetection: ChangeDetectionStrategy.OnPush`
- Grid of wishlist items showing product info + current price
- "Remove" button per item
- "Move to Cart" button per item (adds to cart + removes from wishlist)
- Empty state when no items
- All subscriptions use `takeUntilDestroyed()`

---

## Implementation Order

### Phase 1: Shared Library
1. Create `IWishlist`, `IWishlistItem` interfaces
2. Add `WISHLIST` routes to `API_ROUTES`
3. Export from barrel file

### Phase 2: Backend — Domain Layer
4. Create `Wishlist` entity
5. Create `WishlistItem` entity
6. Create `IWishlistRepository` (abstract class)
7. Create `IWishlistItemRepository` (abstract class)

### Phase 3: Backend — Infrastructure Layer
8. Create `WishlistRepository` (TypeORM implementation)
9. Create `WishlistItemRepository` (TypeORM implementation)

### Phase 4: Backend — Application + Presentation
10. Create `AddToWishlistDto`
11. Create `WishlistService` (depends on repository interfaces)
12. Create `WishlistController`
13. Create `WishlistModule` (wires interfaces to implementations)
14. Register `WishlistModule` in `AppModule`

### Phase 5: Frontend Core
15. Create `WishlistStore`
16. Create `WishlistService`
17. Add `/wishlist` route to `app.routes.ts`

### Phase 6: Frontend UI
18. Create `WishlistComponent` (page)
19. Add heart toggle to `ProductCardComponent`
20. Add heart toggle to `ProductDetailComponent`
21. Add wishlist icon + badge to `NavbarComponent`

### Phase 7: Integration
22. Load wishlist on app init (when authenticated)
23. "Move to Cart" integration (calls CartService + WishlistService)
24. Clear wishlist store on logout

---

## Design Notes

- **Clean Architecture:** Service depends on repository interfaces (domain layer), not TypeORM. Swapping the ORM only requires new infrastructure implementations.
- **Repository Pattern:** Abstract classes as DI tokens. NestJS module wires `{ provide: IWishlistRepository, useClass: WishlistRepository }`.
- **Auth:** All endpoints require JWT (same as cart)
- **Eager loading:** Product data loaded with wishlist items
- **Frontend:** Follows CLAUDE.md Angular best practices — `OnPush`, signals, `input()`/`output()`, `@if`/`@for`, `takeUntilDestroyed()`, separate HTML/SCSS/spec files, `class` bindings, `providedIn: 'root'` services
- **Testability:** Repository interfaces make the service unit-testable with mocks — no database needed
