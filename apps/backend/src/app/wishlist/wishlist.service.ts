import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { WishlistItem } from './entities/wishlist-item.entity';
import { Product } from '../products/entities/product.entity';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';

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

  async getWishlist(userId: number): Promise<Wishlist> {
    return this.getOrCreateWishlist(userId);
  }

  async addItem(userId: number, dto: AddToWishlistDto): Promise<Wishlist> {
    const wishlist = await this.getOrCreateWishlist(userId);
    const product = await this.productRepo.findOne({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    const existing = wishlist.items.find(
      (item) => item.productId === dto.productId,
    );
    if (!existing) {
      const wishlistItem = this.wishlistItemRepo.create({
        wishlistId: wishlist.id,
        productId: dto.productId,
      });
      await this.wishlistItemRepo.save(wishlistItem);
    }
    return this.getOrCreateWishlist(userId);
  }

  async removeItem(userId: number, itemId: number): Promise<Wishlist> {
    const wishlist = await this.getOrCreateWishlist(userId);
    const item = wishlist.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Wishlist item not found');
    }
    await this.wishlistItemRepo.remove(item);
    return this.getOrCreateWishlist(userId);
  }

  private async getOrCreateWishlist(userId: number): Promise<Wishlist> {
    let wishlist = await this.wishlistRepo.findOne({
      where: { userId },
      relations: ['items', 'items.product'],
    });
    if (!wishlist) {
      wishlist = this.wishlistRepo.create({ userId });
      wishlist = await this.wishlistRepo.save(wishlist);
      wishlist.items = [];
    }
    return wishlist;
  }
}
