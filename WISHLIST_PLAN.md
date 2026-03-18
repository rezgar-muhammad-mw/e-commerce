# Wishlist Feature - Architecture Plan

## Overview

Add a **Wishlist** feature that lets authenticated users save products they're interested in. The wishlist is persisted in the database per user (survives across sessions). Users can add/remove products and move items to their cart.

The backend follows the same **modular architecture** as the rest of the application (see `cart/`, `products/`, `categories/` modules), with services using TypeORM repositories directly.

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

## Backend Architecture — NestJS Module Pattern

### Module Structure

Follows the same flat module structure as `cart/`, `products/`, and `categories/`:

```
app/wishlist/
├── wishlist.module.ts
├── wishlist.controller.ts
├── wishlist.service.ts
├── dto/
│   └── add-to-wishlist.dto.ts
└── entities/
    ├── wishlist.entity.ts
    └── wishlist-item.entity.ts
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

### Entities

```typescript
// entities/wishlist.entity.ts
@Entity('wishlists')
export class Wishlist implements IWishlist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => WishlistItem, (item) => item.wishlist, { eager: true, cascade: true })
  items: WishlistItem[];

  @CreateDateColumn()
  createdAt: Date;
}

// entities/wishlist-item.entity.ts
@Entity('wishlist_items')
@Unique(['wishlistId', 'productId'])
export class WishlistItem implements IWishlistItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  wishlistId: number;

  @ManyToOne(() => Wishlist, (wishlist) => wishlist.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wishlistId' })
  wishlist: Wishlist;

  @Column()
  productId: number;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @CreateDateColumn()
  addedAt: Date;
}
```

### Service (Application Layer)

The service uses TypeORM repositories directly via `@InjectRepository`, consistent with how `CartService`, `ProductsService`, etc. work in this project:

```typescript
@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepo: Repository<Wishlist>,
    @InjectRepository(WishlistItem)
    private readonly wishlistItemRepo: Repository<WishlistItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async getWishlist(userId: number): Promise<Wishlist> { ... }
  async addItem(userId: number, productId: number): Promise<Wishlist> { ... }
  async removeItem(userId: number, itemId: number): Promise<Wishlist> { ... }
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
  providers: [WishlistService],
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

### Phase 2: Backend — Entities
4. Create `Wishlist` entity
5. Create `WishlistItem` entity

### Phase 3: Backend — Module, Service, Controller
6. Create `AddToWishlistDto`
7. Create `WishlistService` (uses TypeORM repositories directly)
8. Create `WishlistController`
9. Create `WishlistModule`
10. Register `WishlistModule` in `AppModule`

### Phase 4: Frontend Core
11. Create `WishlistStore`
12. Create `WishlistService`
13. Add `/wishlist` route to `app.routes.ts`

### Phase 5: Frontend UI
14. Create `WishlistComponent` (page)
15. Add heart toggle to `ProductCardComponent`
16. Add heart toggle to `ProductDetailComponent`
17. Add wishlist icon + badge to `NavbarComponent`

### Phase 6: Integration
18. Load wishlist on app init (when authenticated)
19. "Move to Cart" integration (calls CartService + WishlistService)
20. Clear wishlist store on logout

---

## Design Notes

- **Module pattern:** Follows the same flat module structure as `cart/`, `products/`, `categories/` — service injects TypeORM repositories directly via `@InjectRepository`, no abstract interfaces or infrastructure layer
- **Auth:** All endpoints require JWT (same as cart)
- **Eager loading:** Product data loaded with wishlist items
- **Frontend:** Follows CLAUDE.md Angular best practices — `OnPush`, signals, `input()`/`output()`, `@if`/`@for`, `takeUntilDestroyed()`, separate HTML/SCSS/spec files, `class` bindings, `providedIn: 'root'` services
