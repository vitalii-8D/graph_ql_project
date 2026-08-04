import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddGeoAndPresenceToUsers1790000000002 implements MigrationInterface {
  name = 'AddGeoAndPresenceToUsers1790000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "city" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD "latitude" double precision`);
    await queryRunner.query(`ALTER TABLE "users" ADD "longitude" double precision`);
    await queryRunner.query(`ALTER TABLE "users" ADD "last_active_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "users" ADD "is_online" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "users" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_online"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_active_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "longitude"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "latitude"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "city"`);
  }
}
