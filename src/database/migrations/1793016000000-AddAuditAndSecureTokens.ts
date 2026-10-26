import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditAndSecureTokens1793016000000 implements MigrationInterface {
  name = 'AddAuditAndSecureTokens1793016000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_token" ALTER COLUMN "token" TYPE varchar(64)`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."audit_log_action_enum" AS ENUM('create', 'update', 'delete')`,
    );
    await queryRunner.query(`
      CREATE TABLE "audit_log" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "action" "public"."audit_log_action_enum" NOT NULL,
        "entityName" varchar(120) NOT NULL,
        "entityId" varchar(255),
        "actorId" uuid,
        "ipHash" varchar(64),
        "changes" jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_log_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_log_entity" ON "audit_log" ("entityName", "entityId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_log_actor" ON "audit_log" ("actorId")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_log_actor"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_log_entity"`);
    await queryRunner.query(`DROP TABLE "audit_log"`);
    await queryRunner.query(`DROP TYPE "public"."audit_log_action_enum"`);
    await queryRunner.query(
      `ALTER TABLE "refresh_token" ALTER COLUMN "token" TYPE varchar(255)`,
    );
  }
}
