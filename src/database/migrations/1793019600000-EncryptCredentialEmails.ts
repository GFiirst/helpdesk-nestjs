import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';
import { MigrationInterface, QueryRunner } from 'typeorm';

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export class EncryptCredentialEmails1793019600000 implements MigrationInterface {
  name = 'EncryptCredentialEmails1793019600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const key = this.encryptionKey();
    await queryRunner.query(`DROP INDEX "public"."credential_email_unique_active"`);
    await queryRunner.query(`ALTER TABLE "credential" RENAME COLUMN "email" TO "emailEncrypted"`);
    await queryRunner.query(`ALTER TABLE "credential" ALTER COLUMN "emailEncrypted" TYPE varchar(512)`);
    await queryRunner.query(`ALTER TABLE "credential" ADD "emailHash" varchar(64)`);

    const credentials = (await queryRunner.query(`SELECT "id", "emailEncrypted" FROM "credential"`)) as Array<{
      id: string;
      emailEncrypted: string;
    }>;

    for (const credential of credentials) {
      const normalizedEmail = credential.emailEncrypted.trim().toLowerCase();
      await queryRunner.query(`UPDATE "credential" SET "emailEncrypted" = $1, "emailHash" = $2 WHERE "id" = $3`, [
        this.encrypt(normalizedEmail, key),
        this.hashEmail(normalizedEmail, key),
        credential.id,
      ]);
    }

    await queryRunner.query(`ALTER TABLE "credential" ALTER COLUMN "emailHash" SET NOT NULL`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "credential_email_hash_unique_active" ON "credential" ("emailHash") WHERE "deletedAt" IS NULL`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const key = this.encryptionKey();
    const credentials = (await queryRunner.query(`SELECT "id", "emailEncrypted" FROM "credential"`)) as Array<{
      id: string;
      emailEncrypted: string;
    }>;

    for (const credential of credentials) {
      await queryRunner.query(`UPDATE "credential" SET "emailEncrypted" = $1 WHERE "id" = $2`, [
        this.decrypt(credential.emailEncrypted, key),
        credential.id,
      ]);
    }

    await queryRunner.query(`DROP INDEX "public"."credential_email_hash_unique_active"`);
    await queryRunner.query(`ALTER TABLE "credential" DROP COLUMN "emailHash"`);
    await queryRunner.query(`ALTER TABLE "credential" ALTER COLUMN "emailEncrypted" TYPE varchar(255)`);
    await queryRunner.query(`ALTER TABLE "credential" RENAME COLUMN "emailEncrypted" TO "email"`);
    await queryRunner.query(`CREATE UNIQUE INDEX "credential_email_unique_active" ON "credential" ("email") WHERE "deletedAt" IS NULL`);
  }

  private encryptionKey(): Buffer {
    const key = Buffer.from(process.env.FIELD_ENCRYPTION_KEY ?? '', 'base64');
    if (key.length !== 32) {
      throw new Error('FIELD_ENCRYPTION_KEY must contain exactly 32 Base64-encoded bytes');
    }

    return key;
  }

  private encrypt(value: string, key: Buffer): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
  }

  private decrypt(value: string, key: Buffer): string {
    const payload = Buffer.from(value, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', key, payload.subarray(0, IV_LENGTH));
    decipher.setAuthTag(payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH));
    return Buffer.concat([decipher.update(payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH)), decipher.final()]).toString('utf8');
  }

  private hashEmail(email: string, key: Buffer): string {
    return createHmac('sha256', key).update(`email:${email}`).digest('hex');
  }
}
