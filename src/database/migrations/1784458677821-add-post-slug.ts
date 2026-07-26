import { type MigrationInterface, type QueryRunner } from 'typeorm';
import { type PostEntity } from '../../posts/entities/post.entity';
import { formatSlug } from '../../utils/format-slug';

export class AddPostSlug1784458677821 implements MigrationInterface {
  name = 'AddPostSlug1784458677821';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" ADD "slug" character varying`);

    const posts = (await queryRunner.query(`SELECT "id", "title" FROM "posts"`)) as PostEntity[];
    for (const post of posts) {
      const slug = formatSlug(post.title);
      await queryRunner.query(`UPDATE "posts" SET "slug" = $1 WHERE "id" = $2`, [slug, post.id]);
    }

    await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "slug" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "slug"`);
  }
}
