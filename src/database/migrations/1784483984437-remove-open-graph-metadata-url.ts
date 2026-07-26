import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class RemoveOpenGraphMetadataUrl1784483984437 implements MigrationInterface {
  name = 'RemoveOpenGraphMetadataUrl1784483984437';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "post_metadata" DROP COLUMN "url"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "post_metadata" ADD "url" character varying`);
  }
}
