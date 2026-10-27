import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Animal, AnimalStatus } from '../animals/animal.entity';
import { AdoptionRequest, AdoptionStatus } from './adoption-request.entity';
import { CreateAdoptionDto } from './dto/create-adoption.dto';

@Injectable()
export class AdoptionsService {
  constructor(
    @InjectRepository(AdoptionRequest)
    private readonly requests: Repository<AdoptionRequest>,
    @InjectRepository(Animal)
    private readonly animals: Repository<Animal>,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, dto: CreateAdoptionDto): Promise<AdoptionRequest> {
    const animal = await this.animals.findOne({ where: { id: dto.animalId } });
    if (!animal) {
      throw new NotFoundException('Животное не найдено');
    }
    if (animal.status !== AnimalStatus.Available) {
      throw new ConflictException('Животное недоступно для усыновления');
    }

    const activeRequests = await this.requests.count({
      where: { animalId: dto.animalId, userId, status: AdoptionStatus.Pending },
    });
    if (activeRequests > 0) {
      throw new ConflictException('У вас уже есть активная заявка на это животное');
    }

    return this.requests.save(
      this.requests.create({ animalId: dto.animalId, userId, message: dto.message }),
    );
  }

  findMine(userId: string): Promise<AdoptionRequest[]> {
    return this.requests.find({
      where: { userId },
      relations: { animal: true },
      order: { createdAt: 'DESC' },
    });
  }

  findAll(status?: AdoptionStatus): Promise<AdoptionRequest[]> {
    return this.requests.find({
      where: status ? { status } : {},
      relations: { animal: true, user: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Одобрение заявки в одной транзакции:
   * заявка → approved, животное → adopted, остальные ожидающие заявки на него → rejected.
   */
  approve(id: string): Promise<AdoptionRequest> {
    return this.dataSource.transaction(async (manager) => {
      const requests = manager.getRepository(AdoptionRequest);
      const request = await this.getPending(requests, id);

      request.status = AdoptionStatus.Approved;
      await requests.save(request);

      await manager
        .getRepository(Animal)
        .update({ id: request.animalId }, { status: AnimalStatus.Adopted });

      await requests.update(
        { animalId: request.animalId, status: AdoptionStatus.Pending },
        { status: AdoptionStatus.Rejected },
      );

      request.animal.status = AnimalStatus.Adopted;
      return request;
    });
  }

  async reject(id: string): Promise<AdoptionRequest> {
    const request = await this.getPending(this.requests, id);
    request.status = AdoptionStatus.Rejected;
    return this.requests.save(request);
  }

  /** Пользователь может отозвать только свою заявку, пока она не рассмотрена. */
  async cancel(id: string, userId: string): Promise<void> {
    const request = await this.requests.findOne({ where: { id, userId } });
    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }
    if (request.status !== AdoptionStatus.Pending) {
      throw new ConflictException('Рассмотренную заявку нельзя отозвать');
    }
    await this.requests.remove(request);
  }

  private async getPending(
    repository: Repository<AdoptionRequest>,
    id: string,
  ): Promise<AdoptionRequest> {
    const request = await repository.findOne({ where: { id }, relations: { animal: true } });
    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }
    if (request.status !== AdoptionStatus.Pending) {
      throw new ConflictException('Заявка уже рассмотрена');
    }
    return request;
  }
}
