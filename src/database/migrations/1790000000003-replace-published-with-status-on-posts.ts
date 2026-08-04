import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class ReplacePublishedWithStatusOnPosts1790000000003 implements MigrationInterface {
  name = 'ReplacePublishedWithStatusOnPosts1790000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" ADD "status" text NOT NULL DEFAULT 'draft'`);
    await queryRunner.query(`UPDATE "posts" SET "status" = 'published' WHERE "published" = true`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "published"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" ADD "published" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`UPDATE "posts" SET "published" = true WHERE "status" = 'published'`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "status"`);
  }
}
