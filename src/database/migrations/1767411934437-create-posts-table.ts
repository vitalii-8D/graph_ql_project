import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class CreatePostsTable1767411934437 implements MigrationInterface {
  name = 'CreatePostsTable1767411934437';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "posts" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "content" text NOT NULL, "published" boolean NOT NULL DEFAULT (0), "author_id" integer NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `CREATE TABLE "posts_categories_categories" ("postsId" integer NOT NULL, "categoriesId" integer NOT NULL, PRIMARY KEY ("postsId", "categoriesId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f50a96e3d32263cc97588d91d6" ON "posts_categories_categories" ("postsId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bb4ea8658b6d38df2a5f93cd50" ON "posts_categories_categories" ("categoriesId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_posts" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "content" text NOT NULL, "published" boolean NOT NULL DEFAULT (0), "author_id" integer NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_312c63be865c81b922e39c2475e" FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_posts"("id", "title", "content", "published", "author_id", "created_at", "updated_at") SELECT "id", "title", "content", "published", "author_id", "created_at", "updated_at" FROM "posts"`,
    );
    await queryRunner.query(`DROP TABLE "posts"`);
    await queryRunner.query(`ALTER TABLE "temporary_posts" RENAME TO "posts"`);
    await queryRunner.query(`DROP INDEX "IDX_f50a96e3d32263cc97588d91d6"`);
    await queryRunner.query(`DROP INDEX "IDX_bb4ea8658b6d38df2a5f93cd50"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_posts_categories_categories" ("postsId" integer NOT NULL, "categoriesId" integer NOT NULL, CONSTRAINT "FK_f50a96e3d32263cc97588d91d6e" FOREIGN KEY ("postsId") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "FK_bb4ea8658b6d38df2a5f93cd506" FOREIGN KEY ("categoriesId") REFERENCES "categories" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, PRIMARY KEY ("postsId", "categoriesId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_posts_categories_categories"("postsId", "categoriesId") SELECT "postsId", "categoriesId" FROM "posts_categories_categories"`,
    );
    await queryRunner.query(`DROP TABLE "posts_categories_categories"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_posts_categories_categories" RENAME TO "posts_categories_categories"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f50a96e3d32263cc97588d91d6" ON "posts_categories_categories" ("postsId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bb4ea8658b6d38df2a5f93cd50" ON "posts_categories_categories" ("categoriesId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_bb4ea8658b6d38df2a5f93cd50"`);
    await queryRunner.query(`DROP INDEX "IDX_f50a96e3d32263cc97588d91d6"`);
    await queryRunner.query(
      `ALTER TABLE "posts_categories_categories" RENAME TO "temporary_posts_categories_categories"`,
    );
    await queryRunner.query(
      `CREATE TABLE "posts_categories_categories" ("postsId" integer NOT NULL, "categoriesId" integer NOT NULL, PRIMARY KEY ("postsId", "categoriesId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "posts_categories_categories"("postsId", "categoriesId") SELECT "postsId", "categoriesId" FROM "temporary_posts_categories_categories"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_posts_categories_categories"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_bb4ea8658b6d38df2a5f93cd50" ON "posts_categories_categories" ("categoriesId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f50a96e3d32263cc97588d91d6" ON "posts_categories_categories" ("postsId") `,
    );
    await queryRunner.query(`ALTER TABLE "posts" RENAME TO "temporary_posts"`);
    await queryRunner.query(
      `CREATE TABLE "posts" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "content" text NOT NULL, "published" boolean NOT NULL DEFAULT (0), "author_id" integer NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `INSERT INTO "posts"("id", "title", "content", "published", "author_id", "created_at", "updated_at") SELECT "id", "title", "content", "published", "author_id", "created_at", "updated_at" FROM "temporary_posts"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_posts"`);
    await queryRunner.query(`DROP INDEX "IDX_bb4ea8658b6d38df2a5f93cd50"`);
    await queryRunner.query(`DROP INDEX "IDX_f50a96e3d32263cc97588d91d6"`);
    await queryRunner.query(`DROP TABLE "posts_categories_categories"`);
    await queryRunner.query(`DROP TABLE "posts"`);
  }
}
