import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class CreateChatTables1785143647604 implements MigrationInterface {
  name = 'CreateChatTables1785143647604';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chat_rooms" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_da0a82e8162f899dabdca236888" UNIQUE ("name"), CONSTRAINT "PK_c69082bd83bffeb71b0f455bd59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "chat_messages" ("id" SERIAL NOT NULL, "message" text NOT NULL, "userId" integer NOT NULL, "roomId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_40c55ee0e571e268b0d3cd37d10" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_43d968962b9e24e1e3517c0fbff" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_9fa0373c1451ad384fc6a74aa8c" FOREIGN KEY ("roomId") REFERENCES "chat_rooms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_9fa0373c1451ad384fc6a74aa8c"`);
    await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_43d968962b9e24e1e3517c0fbff"`);
    await queryRunner.query(`DROP TABLE "chat_messages"`);
    await queryRunner.query(`DROP TABLE "chat_rooms"`);
  }
}
