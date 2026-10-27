import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../common/role.enum';
import { User } from './user.entity';

export interface CreateUserData {
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
}

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email } });
  }

  /** Возвращает пользователя вместе с хэшем пароля — только для проверки логина. */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.users.findOne({
      where: { email },
      select: { id: true, email: true, name: true, role: true, passwordHash: true, createdAt: true },
    });
  }

  create(data: CreateUserData): Promise<User> {
    return this.users.save(this.users.create(data));
  }
}
