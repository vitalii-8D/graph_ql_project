import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class CreatePaymentTransactionsTable1790000000007 implements MigrationInterface {
  name = 'CreatePaymentTransactionsTable1790000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "payment_transactions" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "post_id" integer NOT NULL, "stripe_checkout_session_id" character varying, "stripe_payment_intent_id" character varying, "stripe_refund_id" character varying, "amount" integer NOT NULL, "currency" character varying NOT NULL DEFAULT 'usd', "status" text NOT NULL DEFAULT 'pending', "failure_reason" text, "refunded_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_payment_transactions_stripe_payment_intent_id" UNIQUE ("stripe_payment_intent_id"), CONSTRAINT "PK_payment_transactions_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_transactions" ADD CONSTRAINT "FK_payment_transactions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_transactions" ADD CONSTRAINT "FK_payment_transactions_post_id" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_payment_transactions_user_id" ON "payment_transactions" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_payment_transactions_post_id" ON "payment_transactions" ("post_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_payment_transactions_post_id"`);
    await queryRunner.query(`DROP INDEX "IDX_payment_transactions_user_id"`);
    await queryRunner.query(`ALTER TABLE "payment_transactions" DROP CONSTRAINT "FK_payment_transactions_post_id"`);
    await queryRunner.query(`ALTER TABLE "payment_transactions" DROP CONSTRAINT "FK_payment_transactions_user_id"`);
    await queryRunner.query(`DROP TABLE "payment_transactions"`);
  }
}
