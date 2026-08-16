import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddPaymentFieldsToPosts1790000000006 implements MigrationInterface {
  name = 'AddPaymentFieldsToPosts1790000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" ADD "has_been_published" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "posts" ADD "payment_status" text NOT NULL DEFAULT 'not_required'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "payment_status"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "has_been_published"`);
  }
}
