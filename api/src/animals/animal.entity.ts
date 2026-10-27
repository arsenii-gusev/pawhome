import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum Species {
  Dog = 'dog',
  Cat = 'cat',
  Other = 'other',
}

export enum AnimalStatus {
  Available = 'available',
  Reserved = 'reserved',
  Adopted = 'adopted',
}

@Entity('animals')
export class Animal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  species: Species;

  @Column({ type: 'varchar', length: 100, nullable: true })
  breed: string | null;

  @Column({ name: 'age_months', type: 'int' })
  ageMonths: number;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'varchar', length: 20, default: AnimalStatus.Available })
  status: AnimalStatus;

  @Column({ name: 'photo_url', type: 'varchar', length: 500, nullable: true })
  photoUrl: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
