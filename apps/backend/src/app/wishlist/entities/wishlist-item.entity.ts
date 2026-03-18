import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Wishlist } from './wishlist.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('wishlist_items')
@Unique(['wishlistId', 'productId'])
export class WishlistItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Wishlist, (wishlist) => wishlist.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wishlistId' })
  wishlist: Wishlist;

  @Column()
  wishlistId: number;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: number;

  @CreateDateColumn()
  addedAt: Date;
}
