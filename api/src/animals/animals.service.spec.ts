import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ILike } from 'typeorm';
import { Animal, AnimalStatus, Species } from './animal.entity';
import { AnimalsService } from './animals.service';

describe('AnimalsService', () => {
  let service: AnimalsService;
  const repo = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((dto: Partial<Animal>) => ({ ...dto }) as Animal),
    save: jest.fn(async (entity: Animal) => ({ id: 'a-1', ...entity })),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [AnimalsService, { provide: getRepositoryToken(Animal), useValue: repo }],
    }).compile();
    service = moduleRef.get(AnimalsService);
  });

  describe('findAll', () => {
    it('применяет фильтры и пагинацию', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({
        species: Species.Dog,
        status: AnimalStatus.Available,
        page: 3,
        limit: 10,
      });

      expect(repo.findAndCount).toHaveBeenCalledWith({
        where: { species: Species.Dog, status: AnimalStatus.Available },
        order: { createdAt: 'DESC' },
        skip: 20,
        take: 10,
      });
      expect(result).toEqual({ items: [], total: 0, page: 3, limit: 10 });
    });

    it('ищет по кличке ИЛИ породе', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ species: Species.Cat, search: '  барс ' });

      const { where } = repo.findAndCount.mock.calls[0][0];
      expect(where).toEqual([
        { species: Species.Cat, name: ILike('%барс%') },
        { species: Species.Cat, breed: ILike('%барс%') },
      ]);
    });
  });

  it('findOne бросает 404 для несуществующего животного', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update меняет только переданные поля', async () => {
    repo.findOne.mockResolvedValue({ id: 'a-1', name: 'Барсик', status: AnimalStatus.Available });

    const updated = await service.update('a-1', { status: AnimalStatus.Reserved });

    expect(updated).toMatchObject({ id: 'a-1', name: 'Барсик', status: AnimalStatus.Reserved });
  });

  it('remove бросает 404, если ничего не удалено', async () => {
    repo.delete.mockResolvedValue({ affected: 0, raw: [] });
    await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
