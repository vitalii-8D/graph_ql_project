import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddUniqueConstraintToPostSlug1790000000009 implements MigrationInterface {
  name = 'AddUniqueConstraintToPostSlug1790000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "UQ_posts_slug" UNIQUE ("slug")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "UQ_posts_slug"`);
  }
}
