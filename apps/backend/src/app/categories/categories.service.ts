import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async findAll(): Promise<(Category & { productCount: number })[]> {
    const categories = await this.categoryRepo
      .createQueryBuilder('category')
      .loadRelationCountAndMap('category.productCount', 'category.products')
      .getMany();
    return categories as (Category & { productCount: number })[];
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const category = this.categoryRepo.create({ ...dto, slug });
    return this.categoryRepo.save(category);
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    if (dto.name) {
      (category as any).slug = dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepo.remove(category);
  }
}
