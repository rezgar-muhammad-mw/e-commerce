import { ICategory } from './category.interface.js';

export interface IProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  categoryId: number;
  category?: ICategory;
  createdAt: string;
  updatedAt: string;
}

export interface IProductQuery {
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price' | 'name' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
