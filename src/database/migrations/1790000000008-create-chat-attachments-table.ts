import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class CreateChatAttachmentsTable1790000000008 implements MigrationInterface {
  name = 'CreateChatAttachmentsTable1790000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chat_attachments" ("id" SERIAL NOT NULL, "message_id" integer NOT NULL, "key" character varying NOT NULL, "url" character varying NOT NULL, "original_file_name" character varying NOT NULL, "mime_type" character varying NOT NULL, "size_bytes" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_chat_attachments_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_attachments" ADD CONSTRAINT "FK_chat_attachments_message_id" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chat_attachments" DROP CONSTRAINT "FK_chat_attachments_message_id"`);
    await queryRunner.query(`DROP TABLE "chat_attachments"`);
  }
}
