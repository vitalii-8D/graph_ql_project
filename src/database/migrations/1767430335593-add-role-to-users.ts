import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoleToUsers1767430335593 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin'))
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE users DROP COLUMN role
        `);
  }
}
