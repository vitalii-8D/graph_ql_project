import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class CreateCategoriesTable1767410864245 implements MigrationInterface {
  name = 'CreateCategoriesTable1767410864245';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "description" varchar, CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE ("name"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "categories"`);
  }
}
