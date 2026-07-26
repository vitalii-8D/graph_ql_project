import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class CreatePostsTable1767411934437 implements MigrationInterface {
  name = 'CreatePostsTable1767411934437';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "posts" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "content" text NOT NULL, "published" boolean NOT NULL DEFAULT false, "author_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "posts_categories_categories" ("postsId" integer NOT NULL, "categoriesId" integer NOT NULL, CONSTRAINT "PK_dcb828476cfb3dac4d2eb823faf" PRIMARY KEY ("postsId", "categoriesId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f50a96e3d32263cc97588d91d6" ON "posts_categories_categories" ("postsId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bb4ea8658b6d38df2a5f93cd50" ON "posts_categories_categories" ("categoriesId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_312c63be865c81b922e39c2475e" FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts_categories_categories" ADD CONSTRAINT "FK_f50a96e3d32263cc97588d91d6e" FOREIGN KEY ("postsId") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts_categories_categories" ADD CONSTRAINT "FK_bb4ea8658b6d38df2a5f93cd506" FOREIGN KEY ("categoriesId") REFERENCES "categories" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts_categories_categories" DROP CONSTRAINT "FK_bb4ea8658b6d38df2a5f93cd506"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts_categories_categories" DROP CONSTRAINT "FK_f50a96e3d32263cc97588d91d6e"`,
    );
    await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_312c63be865c81b922e39c2475e"`);
    await queryRunner.query(`DROP INDEX "IDX_bb4ea8658b6d38df2a5f93cd50"`);
    await queryRunner.query(`DROP INDEX "IDX_f50a96e3d32263cc97588d91d6"`);
    await queryRunner.query(`DROP TABLE "posts_categories_categories"`);
    await queryRunner.query(`DROP TABLE "posts"`);
  }
}
