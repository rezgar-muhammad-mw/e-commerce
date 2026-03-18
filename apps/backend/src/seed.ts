import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './app/users/entities/user.entity';
import { Category } from './app/categories/entities/category.entity';
import { Product } from './app/products/entities/product.entity';
import { Cart } from './app/cart/entities/cart.entity';
import { CartItem } from './app/cart/entities/cart-item.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'ecommerce',
  entities: [User, Category, Product, Cart, CartItem],
  synchronize: true,
});

async function seed() {
  await dataSource.initialize();
  console.log('Connected to database');

  const categoryRepo = dataSource.getRepository(Category);
  const productRepo = dataSource.getRepository(Product);
  const userRepo = dataSource.getRepository(User);

  // Clear existing data
  await dataSource.query('TRUNCATE TABLE cart_items, carts, products, categories, users RESTART IDENTITY CASCADE');

  // Seed Categories
  const categories = await categoryRepo.save([
    { name: 'Electronics', slug: 'electronics', description: 'Gadgets and electronic devices' },
    { name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel' },
    { name: 'Books', slug: 'books', description: 'Physical and digital books' },
    { name: 'Home & Garden', slug: 'home-garden', description: 'Home improvement and garden supplies' },
    { name: 'Sports', slug: 'sports', description: 'Sports equipment and activewear' },
  ]);
  console.log(`Seeded ${categories.length} categories`);

  // Seed Products
  const products = await productRepo.save([
    { name: 'Wireless Headphones', description: 'Premium noise-cancelling wireless headphones with 30-hour battery life. Features active noise cancellation and transparency mode.', price: 199.99, imageUrl: '', stock: 50, categoryId: categories[0].id },
    { name: 'Smartphone Stand', description: 'Adjustable aluminum smartphone and tablet stand. Compatible with all devices from 4 to 13 inches.', price: 29.99, imageUrl: '', stock: 100, categoryId: categories[0].id },
    { name: 'Mechanical Keyboard', description: 'RGB mechanical keyboard with Cherry MX switches. Full-size layout with media controls and USB passthrough.', price: 149.99, imageUrl: '', stock: 30, categoryId: categories[0].id },
    { name: 'USB-C Hub', description: '7-in-1 USB-C hub with HDMI, USB 3.0, SD card reader, and 100W PD charging. Aluminum body.', price: 59.99, imageUrl: '', stock: 75, categoryId: categories[0].id },
    { name: 'Wireless Mouse', description: 'Ergonomic wireless mouse with dual Bluetooth and 2.4GHz connectivity. Silent clicks and 6-month battery.', price: 39.99, imageUrl: '', stock: 120, categoryId: categories[0].id },
    { name: 'Cotton T-Shirt', description: '100% organic cotton crew neck t-shirt. Pre-shrunk, comfortable fit available in multiple colors.', price: 24.99, imageUrl: '', stock: 200, categoryId: categories[1].id },
    { name: 'Denim Jacket', description: 'Classic denim jacket with button closure. Vintage wash with chest pockets and adjustable waist tabs.', price: 89.99, imageUrl: '', stock: 40, categoryId: categories[1].id },
    { name: 'Running Shoes', description: 'Lightweight running shoes with responsive cushioning and breathable mesh upper. Ideal for daily runs.', price: 129.99, imageUrl: '', stock: 60, categoryId: categories[1].id },
    { name: 'Winter Scarf', description: 'Soft cashmere blend winter scarf. Generous size for wrapping and styling. Available in solid colors.', price: 44.99, imageUrl: '', stock: 80, categoryId: categories[1].id },
    { name: 'TypeScript Handbook', description: 'Comprehensive guide to TypeScript programming. Covers types, generics, decorators, and advanced patterns.', price: 39.99, imageUrl: '', stock: 150, categoryId: categories[2].id },
    { name: 'Clean Architecture', description: 'Robert C. Martin\'s guide to software architecture. Learn to build maintainable and scalable systems.', price: 34.99, imageUrl: '', stock: 100, categoryId: categories[2].id },
    { name: 'Design Patterns', description: 'Classic Gang of Four design patterns explained with modern examples in TypeScript and JavaScript.', price: 49.99, imageUrl: '', stock: 80, categoryId: categories[2].id },
    { name: 'Smart LED Bulbs (4-pack)', description: 'WiFi-enabled LED bulbs with 16 million colors. Works with voice assistants and scheduling app.', price: 34.99, imageUrl: '', stock: 200, categoryId: categories[3].id },
    { name: 'Garden Tool Set', description: '5-piece stainless steel garden tool set with ergonomic handles. Includes trowel, pruner, rake, and more.', price: 49.99, imageUrl: '', stock: 60, categoryId: categories[3].id },
    { name: 'Throw Blanket', description: 'Ultra-soft microfiber throw blanket. Machine washable, perfect for couch or bedroom. 50x60 inches.', price: 29.99, imageUrl: '', stock: 90, categoryId: categories[3].id },
    { name: 'Yoga Mat', description: 'Non-slip yoga mat with alignment lines. 6mm thick, eco-friendly TPE material. Includes carrying strap.', price: 34.99, imageUrl: '', stock: 100, categoryId: categories[4].id },
    { name: 'Resistance Bands Set', description: '5-level resistance bands with handles and door anchor. Perfect for home workouts and physical therapy.', price: 24.99, imageUrl: '', stock: 150, categoryId: categories[4].id },
    { name: 'Water Bottle', description: 'Insulated stainless steel water bottle. Keeps drinks cold 24h or hot 12h. BPA-free, 32oz capacity.', price: 27.99, imageUrl: '', stock: 200, categoryId: categories[4].id },
  ]);
  console.log(`Seeded ${products.length} products`);

  // Seed Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await userRepo.save({
    email: 'admin@shopnx.com',
    password: hashedPassword,
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
  });

  // Seed Demo Customer
  const customerPassword = await bcrypt.hash('customer123', 10);
  await userRepo.save({
    email: 'customer@shopnx.com',
    password: customerPassword,
    firstName: 'John',
    lastName: 'Doe',
    role: 'customer',
  });
  console.log('Seeded 2 users (admin@shopnx.com / admin123, customer@shopnx.com / customer123)');

  await dataSource.destroy();
  console.log('Seed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
