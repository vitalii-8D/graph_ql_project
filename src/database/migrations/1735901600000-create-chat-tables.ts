import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChatTables1735901600000 implements MigrationInterface {
  name = 'CreateChatTables1735901600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chat_rooms" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "description" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_chat_room_name" UNIQUE ("name"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "chat_messages" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "message" text NOT NULL, "userId" integer NOT NULL, "roomId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_chat_message_user" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_chat_message_room" FOREIGN KEY ("roomId") REFERENCES "chat_rooms" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_chat_message_room" ON "chat_messages" ("roomId")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_chat_message_user" ON "chat_messages" ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_chat_message_user"`);
    await queryRunner.query(`DROP INDEX "IDX_chat_message_room"`);
    await queryRunner.query(`DROP TABLE "chat_messages"`);
    await queryRunner.query(`DROP TABLE "chat_rooms"`);
  }
}
