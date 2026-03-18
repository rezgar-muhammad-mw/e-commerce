import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async getCart(userId: number) {
    const cart = await this.getOrCreateCart(userId);
    const totalPrice = cart.items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0,
    );
    return { ...cart, totalPrice };
  }

  async addItem(userId: number, dto: AddToCartDto) {
    const cart = await this.getOrCreateCart(userId);
    const product = await this.productRepo.findOne({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock < dto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    let cartItem = cart.items.find(
      (item) => item.productId === dto.productId,
    );

    if (cartItem) {
      cartItem.quantity += dto.quantity;
      await this.cartItemRepo.save(cartItem);
    } else {
      cartItem = this.cartItemRepo.create({
        cartId: cart.id,
        productId: dto.productId,
        quantity: dto.quantity,
        price: product.price,
      });
      await this.cartItemRepo.save(cartItem);
    }

    return this.getCart(userId);
  }

  async updateItem(userId: number, itemId: number, dto: UpdateCartItemDto) {
    const cart = await this.getOrCreateCart(userId);
    const cartItem = cart.items.find((item) => item.id === itemId);

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    const product = await this.productRepo.findOne({
      where: { id: cartItem.productId },
    });

    if (product && product.stock < dto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    cartItem.quantity = dto.quantity;
    await this.cartItemRepo.save(cartItem);
    return this.getCart(userId);
  }

  async removeItem(userId: number, itemId: number) {
    const cart = await this.getOrCreateCart(userId);
    const cartItem = cart.items.find((item) => item.id === itemId);

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartItemRepo.remove(cartItem);
    return this.getCart(userId);
  }

  private async getOrCreateCart(userId: number): Promise<Cart> {
    let cart = await this.cartRepo.findOne({
      where: { userId, status: 'active' },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      cart = this.cartRepo.create({ userId, status: 'active' });
      cart = await this.cartRepo.save(cart);
      cart.items = [];
    }

    return cart;
  }
}
