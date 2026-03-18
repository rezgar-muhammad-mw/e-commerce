import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { IProduct } from '@org/shared';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, MatCardModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
})
export class ProductCardComponent {
  product = input.required<IProduct>();

  getWhole(): string { return Math.floor(Number(this.product().price)).toString(); }
  getCents(): string {
    const d = Math.round((Number(this.product().price) - Math.floor(Number(this.product().price))) * 100);
    return d.toString().padStart(2, '0');
  }
}
