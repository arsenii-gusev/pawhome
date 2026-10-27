import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Animal, Species } from '../animals/animal.entity';
import { Role } from '../common/role.enum';
import { User } from '../users/user.entity';

const DEMO_ANIMALS: Array<Pick<Animal, 'name' | 'species' | 'breed' | 'ageMonths' | 'description'>> = [
  { name: 'Барсик', species: Species.Cat, breed: 'Британская', ageMonths: 18, description: 'Спокойный, любит сидеть на руках, приучен к лотку.' },
  { name: 'Рыжик', species: Species.Dog, breed: 'Метис', ageMonths: 30, description: 'Активный и дружелюбный, отлично ладит с детьми.' },
  { name: 'Луна', species: Species.Cat, breed: null, ageMonths: 6, description: 'Игривый котёнок, стерилизована и привита.' },
  { name: 'Граф', species: Species.Dog, breed: 'Немецкая овчарка', ageMonths: 60, description: 'Умный и преданный, знает базовые команды.' },
  { name: 'Персик', species: Species.Other, breed: 'Карликовый кролик', ageMonths: 12, description: 'Ручной, ест сено и овощи.' },
];

/**
 * Начальные данные при старте приложения:
 * администратор из ADMIN_EMAIL / ADMIN_PASSWORD и демо-животные при SEED_DEMO=true.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Animal) private readonly animals: Repository<Animal>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedAdmin();
    if (this.config.get<string>('SEED_DEMO') === 'true') {
      await this.seedAnimals();
    }
  }

  private async seedAdmin(): Promise<void> {
    const email = this.config.get<string>('ADMIN_EMAIL')?.toLowerCase();
    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!email || !password) return;

    if ((await this.users.count({ where: { email } })) > 0) return;

    await this.users.save(
      this.users.create({
        email,
        name: 'Администратор',
        role: Role.Admin,
        passwordHash: await bcrypt.hash(password, 10),
      }),
    );
    this.logger.log(`Создан администратор ${email}`);
  }

  private async seedAnimals(): Promise<void> {
    if ((await this.animals.count()) > 0) return;

    await this.animals.save(DEMO_ANIMALS.map((animal) => this.animals.create(animal)));
    this.logger.log(`Добавлено демо-животных: ${DEMO_ANIMALS.length}`);
  }
}
