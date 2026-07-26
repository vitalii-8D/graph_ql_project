import { type MigrationInterface, type QueryRunner } from 'typeorm';
import { type PostEntity } from '../../posts/entities/post.entity';
import { formatSlug } from '../../utils/format-slug';

export class AddPostSlug1784458677821 implements MigrationInterface {
  name = 'AddPostSlug1784458677821';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create table with slug as nullable
    await queryRunner.query(
      `CREATE TABLE "temporary_posts" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "content" text NOT NULL, "published" boolean NOT NULL DEFAULT (0), "author_id" integer NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), "slug" varchar, CONSTRAINT "FK_312c63be865c81b922e39c2475e" FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_posts"("id", "title", "content", "published", "author_id", "created_at", "updated_at") SELECT "id", "title", "content", "published", "author_id", "created_at", "updated_at" FROM "posts"`,
    );

    // 2. Populate slug for existing records
    const posts = (await queryRunner.query(`SELECT "id", "title" FROM "temporary_posts"`)) as PostEntity[];
    for (const post of posts) {
      const slug = formatSlug(post.title);
      await queryRunner.query(`UPDATE "temporary_posts" SET "slug" = ? WHERE "id" = ?`, [slug, post.id]);
    }

    await queryRunner.query(`DROP TABLE "posts"`);
    await queryRunner.query(`ALTER TABLE "temporary_posts" RENAME TO "posts"`);

    // 3. Make slug NOT NULL by recreating the table again (SQLite limitation)
    await queryRunner.query(
      `CREATE TABLE "temporary_posts" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "content" text NOT NULL, "published" boolean NOT NULL DEFAULT (0), "author_id" integer NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), "slug" varchar NOT NULL, CONSTRAINT "FK_312c63be865c81b922e39c2475e" FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_posts"("id", "title", "content", "published", "author_id", "created_at", "updated_at", "slug") SELECT "id", "title", "content", "published", "author_id", "created_at", "updated_at", "slug" FROM "posts"`,
    );
    await queryRunner.query(`DROP TABLE "posts"`);
    await queryRunner.query(`ALTER TABLE "temporary_posts" RENAME TO "posts"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" RENAME TO "temporary_posts"`);
    await queryRunner.query(
      `CREATE TABLE "posts" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "content" text NOT NULL, "published" boolean NOT NULL DEFAULT (0), "author_id" integer NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_312c63be865c81b922e39c2475e" FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "posts"("id", "title", "content", "published", "author_id", "created_at", "updated_at") SELECT "id", "title", "content", "published", "author_id", "created_at", "updated_at" FROM "temporary_posts"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_posts"`);
  }
}
