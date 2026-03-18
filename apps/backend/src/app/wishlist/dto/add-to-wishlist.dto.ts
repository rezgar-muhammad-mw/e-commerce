import { IsNumber } from 'class-validator';

export class AddToWishlistDto {
  @IsNumber()
  productId: number;
}
