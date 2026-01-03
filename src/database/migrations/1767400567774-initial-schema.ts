import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1767400567774 implements MigrationInterface {
  name = 'InitialSchema1767400567774';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "profile" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "bio" varchar NOT NULL, "website" varchar, "location" varchar, "userId" integer, CONSTRAINT "REL_a24972ebd73b106250713dcddd" UNIQUE ("userId"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "category" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "description" varchar, CONSTRAINT "UQ_23c05c292c439d77b0de816b500" UNIQUE ("name"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "post" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "content" text NOT NULL, "published" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "authorId" integer)`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "email" varchar NOT NULL, "name" varchar NOT NULL, "age" integer, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "post_categories_category" ("postId" integer NOT NULL, "categoryId" integer NOT NULL, PRIMARY KEY ("postId", "categoryId"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_93b566d522b73cb8bc46f7405b" ON "post_categories_category" ("postId") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_a5e63f80ca58e7296d5864bd2d" ON "post_categories_category" ("categoryId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_profile" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "bio" varchar NOT NULL, "website" varchar, "location" varchar, "userId" integer, CONSTRAINT "REL_a24972ebd73b106250713dcddd" UNIQUE ("userId"), CONSTRAINT "FK_a24972ebd73b106250713dcddd9" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_profile"("id", "bio", "website", "location", "userId") SELECT "id", "bio", "website", "location", "userId" FROM "profile"`,
    );
    await queryRunner.query(`DROP TABLE "profile"`);
    await queryRunner.query(`ALTER TABLE "temporary_profile" RENAME TO "profile"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_post" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "content" text NOT NULL, "published" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "authorId" integer, CONSTRAINT "FK_c6fb082a3114f35d0cc27c518e0" FOREIGN KEY ("authorId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_post"("id", "title", "content", "published", "createdAt", "updatedAt", "authorId") SELECT "id", "title", "content", "published", "createdAt", "updatedAt", "authorId" FROM "post"`,
    );
    await queryRunner.query(`DROP TABLE "post"`);
    await queryRunner.query(`ALTER TABLE "temporary_post" RENAME TO "post"`);
    await queryRunner.query(`DROP INDEX "IDX_93b566d522b73cb8bc46f7405b"`);
    await queryRunner.query(`DROP INDEX "IDX_a5e63f80ca58e7296d5864bd2d"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_post_categories_category" ("postId" integer NOT NULL, "categoryId" integer NOT NULL, CONSTRAINT "FK_93b566d522b73cb8bc46f7405bd" FOREIGN KEY ("postId") REFERENCES "post" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "FK_a5e63f80ca58e7296d5864bd2d3" FOREIGN KEY ("categoryId") REFERENCES "category" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, PRIMARY KEY ("postId", "categoryId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_post_categories_category"("postId", "categoryId") SELECT "postId", "categoryId" FROM "post_categories_category"`,
    );
    await queryRunner.query(`DROP TABLE "post_categories_category"`);
    await queryRunner.query(`ALTER TABLE "temporary_post_categories_category" RENAME TO "post_categories_category"`);
    await queryRunner.query(`CREATE INDEX "IDX_93b566d522b73cb8bc46f7405b" ON "post_categories_category" ("postId") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_a5e63f80ca58e7296d5864bd2d" ON "post_categories_category" ("categoryId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_a5e63f80ca58e7296d5864bd2d"`);
    await queryRunner.query(`DROP INDEX "IDX_93b566d522b73cb8bc46f7405b"`);
    await queryRunner.query(`ALTER TABLE "post_categories_category" RENAME TO "temporary_post_categories_category"`);
    await queryRunner.query(
      `CREATE TABLE "post_categories_category" ("postId" integer NOT NULL, "categoryId" integer NOT NULL, PRIMARY KEY ("postId", "categoryId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "post_categories_category"("postId", "categoryId") SELECT "postId", "categoryId" FROM "temporary_post_categories_category"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_post_categories_category"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_a5e63f80ca58e7296d5864bd2d" ON "post_categories_category" ("categoryId") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_93b566d522b73cb8bc46f7405b" ON "post_categories_category" ("postId") `);
    await queryRunner.query(`ALTER TABLE "post" RENAME TO "temporary_post"`);
    await queryRunner.query(
      `CREATE TABLE "post" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "content" text NOT NULL, "published" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "authorId" integer)`,
    );
    await queryRunner.query(
      `INSERT INTO "post"("id", "title", "content", "published", "createdAt", "updatedAt", "authorId") SELECT "id", "title", "content", "published", "createdAt", "updatedAt", "authorId" FROM "temporary_post"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_post"`);
    await queryRunner.query(`ALTER TABLE "profile" RENAME TO "temporary_profile"`);
    await queryRunner.query(
      `CREATE TABLE "profile" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "bio" varchar NOT NULL, "website" varchar, "location" varchar, "userId" integer, CONSTRAINT "REL_a24972ebd73b106250713dcddd" UNIQUE ("userId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "profile"("id", "bio", "website", "location", "userId") SELECT "id", "bio", "website", "location", "userId" FROM "temporary_profile"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_profile"`);
    await queryRunner.query(`DROP INDEX "IDX_a5e63f80ca58e7296d5864bd2d"`);
    await queryRunner.query(`DROP INDEX "IDX_93b566d522b73cb8bc46f7405b"`);
    await queryRunner.query(`DROP TABLE "post_categories_category"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "post"`);
    await queryRunner.query(`DROP TABLE "category"`);
    await queryRunner.query(`DROP TABLE "profile"`);
  }
}
