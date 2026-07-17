import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class CreatePostMetadataTable1767412449045 implements MigrationInterface {
  name = 'CreatePostMetadataTable1767412449045';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "post_metadata" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "type" text NOT NULL DEFAULT ('article'), "url" varchar, "image" varchar, "image_alt" varchar, "image_width" integer, "image_height" integer, "author" varchar, "publisher" varchar, "published_time" datetime, "modified_time" datetime, "tags" text, "video_url" varchar, "video_duration" integer, "video_width" integer, "video_height" integer, "audio_url" varchar, "price" decimal(10,2), "currency" varchar, "availability" varchar, "event_start_time" datetime, "event_end_time" datetime, "location_address" varchar, "location_lat" decimal(10,7), "location_lon" decimal(10,7), "locale" varchar NOT NULL DEFAULT ('en_US'), "site_name" varchar, "twitter_card" varchar, "twitter_site" varchar, "twitter_creator" varchar, "post_id" integer NOT NULL, CONSTRAINT "REL_1f3b2ee654a7e05f2a6c1a7c83" UNIQUE ("post_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_post_metadata" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "type" text NOT NULL DEFAULT ('article'), "url" varchar, "image" varchar, "image_alt" varchar, "image_width" integer, "image_height" integer, "author" varchar, "publisher" varchar, "published_time" datetime, "modified_time" datetime, "tags" text, "video_url" varchar, "video_duration" integer, "video_width" integer, "video_height" integer, "audio_url" varchar, "price" decimal(10,2), "currency" varchar, "availability" varchar, "event_start_time" datetime, "event_end_time" datetime, "location_address" varchar, "location_lat" decimal(10,7), "location_lon" decimal(10,7), "locale" varchar NOT NULL DEFAULT ('en_US'), "site_name" varchar, "twitter_card" varchar, "twitter_site" varchar, "twitter_creator" varchar, "post_id" integer NOT NULL, CONSTRAINT "REL_1f3b2ee654a7e05f2a6c1a7c83" UNIQUE ("post_id"), CONSTRAINT "FK_1f3b2ee654a7e05f2a6c1a7c838" FOREIGN KEY ("post_id") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_post_metadata"("id", "title", "description", "type", "url", "image", "image_alt", "image_width", "image_height", "author", "publisher", "published_time", "modified_time", "tags", "video_url", "video_duration", "video_width", "video_height", "audio_url", "price", "currency", "availability", "event_start_time", "event_end_time", "location_address", "location_lat", "location_lon", "locale", "site_name", "twitter_card", "twitter_site", "twitter_creator", "post_id") SELECT "id", "title", "description", "type", "url", "image", "image_alt", "image_width", "image_height", "author", "publisher", "published_time", "modified_time", "tags", "video_url", "video_duration", "video_width", "video_height", "audio_url", "price", "currency", "availability", "event_start_time", "event_end_time", "location_address", "location_lat", "location_lon", "locale", "site_name", "twitter_card", "twitter_site", "twitter_creator", "post_id" FROM "post_metadata"`,
    );
    await queryRunner.query(`DROP TABLE "post_metadata"`);
    await queryRunner.query(`ALTER TABLE "temporary_post_metadata" RENAME TO "post_metadata"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "post_metadata" RENAME TO "temporary_post_metadata"`);
    await queryRunner.query(
      `CREATE TABLE "post_metadata" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "type" text NOT NULL DEFAULT ('article'), "url" varchar, "image" varchar, "image_alt" varchar, "image_width" integer, "image_height" integer, "author" varchar, "publisher" varchar, "published_time" datetime, "modified_time" datetime, "tags" text, "video_url" varchar, "video_duration" integer, "video_width" integer, "video_height" integer, "audio_url" varchar, "price" decimal(10,2), "currency" varchar, "availability" varchar, "event_start_time" datetime, "event_end_time" datetime, "location_address" varchar, "location_lat" decimal(10,7), "location_lon" decimal(10,7), "locale" varchar NOT NULL DEFAULT ('en_US'), "site_name" varchar, "twitter_card" varchar, "twitter_site" varchar, "twitter_creator" varchar, "post_id" integer NOT NULL, CONSTRAINT "REL_1f3b2ee654a7e05f2a6c1a7c83" UNIQUE ("post_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "post_metadata"("id", "title", "description", "type", "url", "image", "image_alt", "image_width", "image_height", "author", "publisher", "published_time", "modified_time", "tags", "video_url", "video_duration", "video_width", "video_height", "audio_url", "price", "currency", "availability", "event_start_time", "event_end_time", "location_address", "location_lat", "location_lon", "locale", "site_name", "twitter_card", "twitter_site", "twitter_creator", "post_id") SELECT "id", "title", "description", "type", "url", "image", "image_alt", "image_width", "image_height", "author", "publisher", "published_time", "modified_time", "tags", "video_url", "video_duration", "video_width", "video_height", "audio_url", "price", "currency", "availability", "event_start_time", "event_end_time", "location_address", "location_lat", "location_lon", "locale", "site_name", "twitter_card", "twitter_site", "twitter_creator", "post_id" FROM "temporary_post_metadata"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_post_metadata"`);
    await queryRunner.query(`DROP TABLE "post_metadata"`);
  }
}
