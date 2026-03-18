import { IProduct } from './product.interface.js';

export interface ICart {
  id: number;
  userId: number;
  items: ICartItem[];
  totalPrice: number;
}

export interface ICartItem {
  id: number;
  productId: number;
  product?: IProduct;
  quantity: number;
  price: number;
}
