import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Animal } from './animal.entity';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { QueryAnimalsDto } from './dto/query-animals.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class AnimalsService {
  constructor(@InjectRepository(Animal) private readonly animals: Repository<Animal>) {}

  async findAll(query: QueryAnimalsDto): Promise<Paginated<Animal>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;

    const base: FindOptionsWhere<Animal> = {};
    if (query.species) base.species = query.species;
    if (query.status) base.status = query.status;

    // Поиск по кличке ИЛИ породе: массив условий в TypeORM объединяется через OR
    const search = query.search?.trim();
    const where = search
      ? [
          { ...base, name: ILike(`%${search}%`) },
          { ...base, breed: ILike(`%${search}%`) },
        ]
      : base;

    const [items, total] = await this.animals.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit };
  }

  async findOne(id: string): Promise<Animal> {
    const animal = await this.animals.findOne({ where: { id } });
    if (!animal) {
      throw new NotFoundException('Животное не найдено');
    }
    return animal;
  }

  create(dto: CreateAnimalDto): Promise<Animal> {
    return this.animals.save(this.animals.create(dto));
  }

  async update(id: string, dto: UpdateAnimalDto): Promise<Animal> {
    const animal = await this.findOne(id);
    Object.assign(animal, dto);
    return this.animals.save(animal);
  }

  async remove(id: string): Promise<void> {
    const result = await this.animals.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Животное не найдено');
    }
  }
}
