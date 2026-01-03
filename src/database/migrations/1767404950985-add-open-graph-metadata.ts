import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOpenGraphMetadata1767404950985 implements MigrationInterface {
  name = 'AddOpenGraphMetadata1767404950985';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "open_graph_metadata" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "type" text NOT NULL DEFAULT ('article'), "url" varchar, "image" varchar, "imageAlt" varchar, "imageWidth" integer, "imageHeight" integer, "author" varchar, "publisher" varchar, "publishedTime" datetime, "modifiedTime" datetime, "tags" text, "videoUrl" varchar, "videoDuration" integer, "videoWidth" integer, "videoHeight" integer, "audioUrl" varchar, "price" decimal(10,2), "currency" varchar, "availability" varchar, "eventStartTime" datetime, "eventEndTime" datetime, "locationAddress" varchar, "locationLatitude" decimal(10,7), "locationLongitude" decimal(10,7), "locale" varchar NOT NULL DEFAULT ('en_US'), "siteName" varchar, "twitterCard" varchar, "twitterSite" varchar, "twitterCreator" varchar, "postId" integer, CONSTRAINT "REL_822469ffc5437cdf545a447695" UNIQUE ("postId"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_open_graph_metadata" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "type" text NOT NULL DEFAULT ('article'), "url" varchar, "image" varchar, "imageAlt" varchar, "imageWidth" integer, "imageHeight" integer, "author" varchar, "publisher" varchar, "publishedTime" datetime, "modifiedTime" datetime, "tags" text, "videoUrl" varchar, "videoDuration" integer, "videoWidth" integer, "videoHeight" integer, "audioUrl" varchar, "price" decimal(10,2), "currency" varchar, "availability" varchar, "eventStartTime" datetime, "eventEndTime" datetime, "locationAddress" varchar, "locationLatitude" decimal(10,7), "locationLongitude" decimal(10,7), "locale" varchar NOT NULL DEFAULT ('en_US'), "siteName" varchar, "twitterCard" varchar, "twitterSite" varchar, "twitterCreator" varchar, "postId" integer, CONSTRAINT "REL_822469ffc5437cdf545a447695" UNIQUE ("postId"), CONSTRAINT "FK_822469ffc5437cdf545a4476954" FOREIGN KEY ("postId") REFERENCES "post" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_open_graph_metadata"("id", "title", "description", "type", "url", "image", "imageAlt", "imageWidth", "imageHeight", "author", "publisher", "publishedTime", "modifiedTime", "tags", "videoUrl", "videoDuration", "videoWidth", "videoHeight", "audioUrl", "price", "currency", "availability", "eventStartTime", "eventEndTime", "locationAddress", "locationLatitude", "locationLongitude", "locale", "siteName", "twitterCard", "twitterSite", "twitterCreator", "postId") SELECT "id", "title", "description", "type", "url", "image", "imageAlt", "imageWidth", "imageHeight", "author", "publisher", "publishedTime", "modifiedTime", "tags", "videoUrl", "videoDuration", "videoWidth", "videoHeight", "audioUrl", "price", "currency", "availability", "eventStartTime", "eventEndTime", "locationAddress", "locationLatitude", "locationLongitude", "locale", "siteName", "twitterCard", "twitterSite", "twitterCreator", "postId" FROM "open_graph_metadata"`,
    );
    await queryRunner.query(`DROP TABLE "open_graph_metadata"`);
    await queryRunner.query(`ALTER TABLE "temporary_open_graph_metadata" RENAME TO "open_graph_metadata"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "open_graph_metadata" RENAME TO "temporary_open_graph_metadata"`);
    await queryRunner.query(
      `CREATE TABLE "open_graph_metadata" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "type" text NOT NULL DEFAULT ('article'), "url" varchar, "image" varchar, "imageAlt" varchar, "imageWidth" integer, "imageHeight" integer, "author" varchar, "publisher" varchar, "publishedTime" datetime, "modifiedTime" datetime, "tags" text, "videoUrl" varchar, "videoDuration" integer, "videoWidth" integer, "videoHeight" integer, "audioUrl" varchar, "price" decimal(10,2), "currency" varchar, "availability" varchar, "eventStartTime" datetime, "eventEndTime" datetime, "locationAddress" varchar, "locationLatitude" decimal(10,7), "locationLongitude" decimal(10,7), "locale" varchar NOT NULL DEFAULT ('en_US'), "siteName" varchar, "twitterCard" varchar, "twitterSite" varchar, "twitterCreator" varchar, "postId" integer, CONSTRAINT "REL_822469ffc5437cdf545a447695" UNIQUE ("postId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "open_graph_metadata"("id", "title", "description", "type", "url", "image", "imageAlt", "imageWidth", "imageHeight", "author", "publisher", "publishedTime", "modifiedTime", "tags", "videoUrl", "videoDuration", "videoWidth", "videoHeight", "audioUrl", "price", "currency", "availability", "eventStartTime", "eventEndTime", "locationAddress", "locationLatitude", "locationLongitude", "locale", "siteName", "twitterCard", "twitterSite", "twitterCreator", "postId") SELECT "id", "title", "description", "type", "url", "image", "imageAlt", "imageWidth", "imageHeight", "author", "publisher", "publishedTime", "modifiedTime", "tags", "videoUrl", "videoDuration", "videoWidth", "videoHeight", "audioUrl", "price", "currency", "availability", "eventStartTime", "eventEndTime", "locationAddress", "locationLatitude", "locationLongitude", "locale", "siteName", "twitterCard", "twitterSite", "twitterCreator", "postId" FROM "temporary_open_graph_metadata"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_open_graph_metadata"`);
    await queryRunner.query(`DROP TABLE "open_graph_metadata"`);
  }
}
