import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Cart } from '../../cart/entities/cart.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: 'customer' })
  role: 'customer' | 'admin';

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Cart, (cart) => cart.user)
  carts: Cart[];
}
