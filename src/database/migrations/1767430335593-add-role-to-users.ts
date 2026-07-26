import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddRoleToUsers1767430335593 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "role" text NOT NULL DEFAULT 'user'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
  }
}
