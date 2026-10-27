import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1761500000000 implements MigrationInterface {
  name = 'InitSchema1761500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" varchar(255) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "name" varchar(100) NOT NULL,
        "role" varchar(20) NOT NULL DEFAULT 'user',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "animals" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(100) NOT NULL,
        "species" varchar(20) NOT NULL,
        "breed" varchar(100),
        "age_months" integer NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "status" varchar(20) NOT NULL DEFAULT 'available',
        "photo_url" varchar(500),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_animals" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_animals_status" ON "animals" ("status")`);

    await queryRunner.query(`
      CREATE TABLE "adoption_requests" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "animal_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "message" text NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_adoption_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_adoption_requests_animal" FOREIGN KEY ("animal_id")
          REFERENCES "animals" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_adoption_requests_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_adoption_requests_animal" ON "adoption_requests" ("animal_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_adoption_requests_user" ON "adoption_requests" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "adoption_requests"`);
    await queryRunner.query(`DROP TABLE "animals"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
