import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class CreatePostMetadataTable1767412449045 implements MigrationInterface {
  name = 'CreatePostMetadataTable1767412449045';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "post_metadata" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "type" text NOT NULL DEFAULT 'article', "url" character varying, "image" character varying, "image_alt" character varying, "image_width" integer, "image_height" integer, "author" character varying, "publisher" character varying, "published_time" TIMESTAMP, "modified_time" TIMESTAMP, "tags" text, "video_url" character varying, "video_duration" integer, "video_width" integer, "video_height" integer, "audio_url" character varying, "price" numeric(10,2), "currency" character varying, "availability" character varying, "event_start_time" TIMESTAMP, "event_end_time" TIMESTAMP, "location_address" character varying, "location_lat" numeric(10,7), "location_lon" numeric(10,7), "locale" character varying NOT NULL DEFAULT 'en_US', "site_name" character varying, "twitter_card" character varying, "twitter_site" character varying, "twitter_creator" character varying, "post_id" integer NOT NULL, CONSTRAINT "REL_1f3b2ee654a7e05f2a6c1a7c83" UNIQUE ("post_id"), CONSTRAINT "PK_105f437753064b0bc1710b65ffd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_metadata" ADD CONSTRAINT "FK_1f3b2ee654a7e05f2a6c1a7c838" FOREIGN KEY ("post_id") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "post_metadata" DROP CONSTRAINT "FK_1f3b2ee654a7e05f2a6c1a7c838"`);
    await queryRunner.query(`DROP TABLE "post_metadata"`);
  }
}
