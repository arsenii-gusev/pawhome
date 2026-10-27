import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Animal, AnimalStatus } from '../animals/animal.entity';
import { AdoptionRequest, AdoptionStatus } from './adoption-request.entity';
import { AdoptionsService } from './adoptions.service';

function makeRequestRepo() {
  return {
    count: jest.fn(),
    create: jest.fn((data: Partial<AdoptionRequest>) => ({ ...data }) as AdoptionRequest),
    save: jest.fn(async (entity: AdoptionRequest) => entity),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
}

function makeAnimalRepo() {
  return { findOne: jest.fn(), update: jest.fn() };
}

describe('AdoptionsService', () => {
  let requests: ReturnType<typeof makeRequestRepo>;
  let animals: ReturnType<typeof makeAnimalRepo>;
  let txRequests: ReturnType<typeof makeRequestRepo>;
  let txAnimals: ReturnType<typeof makeAnimalRepo>;
  let service: AdoptionsService;

  beforeEach(() => {
    requests = makeRequestRepo();
    animals = makeAnimalRepo();
    txRequests = makeRequestRepo();
    txAnimals = makeAnimalRepo();

    // Транзакция: колбэк получает менеджер, который отдаёт «транзакционные» репозитории
    const manager = {
      getRepository: (entity: unknown) => (entity === Animal ? txAnimals : txRequests),
    } as unknown as EntityManager;
    const dataSource = {
      transaction: jest.fn((run: (em: EntityManager) => Promise<unknown>) => run(manager)),
    } as unknown as DataSource;

    service = new AdoptionsService(
      requests as unknown as Repository<AdoptionRequest>,
      animals as unknown as Repository<Animal>,
      dataSource,
    );
  });

  describe('create', () => {
    const dto = { animalId: 'a-1', message: 'Хочу забрать домой' };

    it('бросает 404, если животного нет', async () => {
      animals.findOne.mockResolvedValue(null);
      await expect(service.create('u-1', dto)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('бросает 409, если животное уже усыновлено', async () => {
      animals.findOne.mockResolvedValue({ id: 'a-1', status: AnimalStatus.Adopted });
      await expect(service.create('u-1', dto)).rejects.toBeInstanceOf(ConflictException);
    });

    it('бросает 409 на повторную активную заявку', async () => {
      animals.findOne.mockResolvedValue({ id: 'a-1', status: AnimalStatus.Available });
      requests.count.mockResolvedValue(1);
      await expect(service.create('u-1', dto)).rejects.toBeInstanceOf(ConflictException);
    });

    it('создаёт заявку', async () => {
      animals.findOne.mockResolvedValue({ id: 'a-1', status: AnimalStatus.Available });
      requests.count.mockResolvedValue(0);

      const result = await service.create('u-1', dto);

      expect(result).toEqual({ animalId: 'a-1', userId: 'u-1', message: dto.message });
    });
  });

  describe('approve', () => {
    it('одобряет заявку, помечает животное усыновлённым и отклоняет остальные заявки', async () => {
      txRequests.findOne.mockResolvedValue({
        id: 'r-1',
        animalId: 'a-1',
        status: AdoptionStatus.Pending,
        animal: { id: 'a-1', status: AnimalStatus.Available },
      });

      const result = await service.approve('r-1');

      expect(result.status).toBe(AdoptionStatus.Approved);
      expect(result.animal.status).toBe(AnimalStatus.Adopted);
      expect(txAnimals.update).toHaveBeenCalledWith({ id: 'a-1' }, { status: AnimalStatus.Adopted });
      expect(txRequests.update).toHaveBeenCalledWith(
        { animalId: 'a-1', status: AdoptionStatus.Pending },
        { status: AdoptionStatus.Rejected },
      );
      // всё сделано через транзакционный менеджер, а не через обычные репозитории
      expect(requests.save).not.toHaveBeenCalled();
    });

    it('бросает 409 для уже рассмотренной заявки', async () => {
      txRequests.findOne.mockResolvedValue({ id: 'r-1', status: AdoptionStatus.Rejected });
      await expect(service.approve('r-1')).rejects.toBeInstanceOf(ConflictException);
      expect(txAnimals.update).not.toHaveBeenCalled();
    });

    it('бросает 404 для несуществующей заявки', async () => {
      txRequests.findOne.mockResolvedValue(null);
      await expect(service.approve('r-404')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('не даёт отозвать рассмотренную заявку', async () => {
      requests.findOne.mockResolvedValue({ id: 'r-1', status: AdoptionStatus.Approved });
      await expect(service.cancel('r-1', 'u-1')).rejects.toBeInstanceOf(ConflictException);
      expect(requests.remove).not.toHaveBeenCalled();
    });

    it('ищет заявку только среди заявок текущего пользователя', async () => {
      requests.findOne.mockResolvedValue(null);
      await expect(service.cancel('r-1', 'u-2')).rejects.toBeInstanceOf(NotFoundException);
      expect(requests.findOne).toHaveBeenCalledWith({ where: { id: 'r-1', userId: 'u-2' } });
    });
  });
});
