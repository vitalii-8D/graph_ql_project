import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddChatRoomParticipants1785150586421 implements MigrationInterface {
  name = 'AddChatRoomParticipants1785150586421';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chat_room_participants" ("roomId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_4accb4b7faba39f257b96e3ba76" PRIMARY KEY ("roomId", "userId"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_ad730f436d5de09a5bf83cd4a4" ON "chat_room_participants" ("roomId") `);
    await queryRunner.query(`CREATE INDEX "IDX_2b9c65aa497b5b69da6ad4dfc9" ON "chat_room_participants" ("userId") `);
    await queryRunner.query(`ALTER TABLE "chat_rooms" ADD "isDirect" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(
      `ALTER TABLE "chat_room_participants" ADD CONSTRAINT "FK_ad730f436d5de09a5bf83cd4a44" FOREIGN KEY ("roomId") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_room_participants" ADD CONSTRAINT "FK_2b9c65aa497b5b69da6ad4dfc91" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chat_room_participants" DROP CONSTRAINT "FK_2b9c65aa497b5b69da6ad4dfc91"`);
    await queryRunner.query(`ALTER TABLE "chat_room_participants" DROP CONSTRAINT "FK_ad730f436d5de09a5bf83cd4a44"`);
    await queryRunner.query(`ALTER TABLE "chat_rooms" DROP COLUMN "isDirect"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2b9c65aa497b5b69da6ad4dfc9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ad730f436d5de09a5bf83cd4a4"`);
    await queryRunner.query(`DROP TABLE "chat_room_participants"`);
  }
}
