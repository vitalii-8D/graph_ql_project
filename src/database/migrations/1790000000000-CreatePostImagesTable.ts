import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class CreatePostImagesTable1790000000000 implements MigrationInterface {
  name = 'CreatePostImagesTable1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "post_images" ("id" SERIAL NOT NULL, "post_id" integer NOT NULL, "key" character varying NOT NULL, "url" character varying NOT NULL, "original_file_name" character varying NOT NULL, "mime_type" character varying NOT NULL, "size_bytes" integer NOT NULL, "alt_text" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_post_images_post_id" UNIQUE ("post_id"), CONSTRAINT "PK_post_images_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_images" ADD CONSTRAINT "FK_post_images_post_id" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "post_images" DROP CONSTRAINT "FK_post_images_post_id"`);
    await queryRunner.query(`DROP TABLE "post_images"`);
  }
}
