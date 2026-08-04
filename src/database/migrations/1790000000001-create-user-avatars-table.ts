import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class CreateUserAvatarsTable1790000000001 implements MigrationInterface {
  name = 'CreateUserAvatarsTable1790000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_avatars" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "key" character varying NOT NULL, "url" character varying NOT NULL, "original_file_name" character varying NOT NULL, "mime_type" character varying NOT NULL, "size_bytes" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_user_avatars_user_id" UNIQUE ("user_id"), CONSTRAINT "PK_user_avatars_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_avatars" ADD CONSTRAINT "FK_user_avatars_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_avatars" DROP CONSTRAINT "FK_user_avatars_user_id"`);
    await queryRunner.query(`DROP TABLE "user_avatars"`);
  }
}
