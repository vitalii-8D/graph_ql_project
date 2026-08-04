import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddEngagementFieldsToPosts1790000000004 implements MigrationInterface {
  name = 'AddEngagementFieldsToPosts1790000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" ADD "view_count" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "posts" ADD "reading_time_minutes" integer NOT NULL DEFAULT 1`);
    await queryRunner.query(`ALTER TABLE "posts" ADD "comment_count" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "posts" ADD "average_rating" double precision`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "average_rating"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "comment_count"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "reading_time_minutes"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "view_count"`);
  }
}
