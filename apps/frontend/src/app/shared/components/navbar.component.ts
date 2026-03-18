import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { AuthStore } from '../../core/state/auth.store';
import { CartStore } from '../../core/state/cart.store';
import { WishlistStore } from '../../core/state/wishlist.store';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, FormsModule, MatToolbarModule, MatButtonModule, MatIconModule, MatBadgeModule, MatMenuModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  authStore = inject(AuthStore);
  cartStore = inject(CartStore);
  wishlistStore = inject(WishlistStore);
  private authService = inject(AuthService);
  private router = inject(Router);
  searchQuery = '';

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], { queryParams: { search: this.searchQuery.trim() } });
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
