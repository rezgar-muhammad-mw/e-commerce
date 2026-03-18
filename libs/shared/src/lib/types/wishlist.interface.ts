import { IProduct } from './product.interface.js';

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
