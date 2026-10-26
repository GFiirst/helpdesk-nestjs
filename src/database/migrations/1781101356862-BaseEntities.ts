import { MigrationInterface, QueryRunner } from "typeorm";

export class BaseEntities1781101356862 implements MigrationInterface {
    name = 'BaseEntities1781101356862'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."refresh_token_status_enum" AS ENUM('active', 'revoked')`);
        await queryRunner.query(`CREATE TABLE "refresh_token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "token" character varying(255) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."refresh_token_status_enum" NOT NULL DEFAULT 'active', "userAgent" character varying, "device" character varying, "ip" character varying, "credentialId" uuid, CONSTRAINT "PK_b575dd3c21fb0831013c909e7fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c31d0a2f38e6e99110df62ab0a" ON "refresh_token" ("token") `);
        await queryRunner.query(`CREATE TYPE "public"."permissions_action_enum" AS ENUM('manage', 'create', 'read', 'update', 'delete')`);
        await queryRunner.query(`CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "action" "public"."permissions_action_enum" NOT NULL, "subject" character varying NOT NULL, CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."roles_role_enum" AS ENUM('admin', 'manager', 'agent', 'user')`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "role" "public"."roles_role_enum" NOT NULL DEFAULT 'user', CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "profile" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL, "phone" character varying, "department" character varying, "remoteAccess" character varying, "isAvailable" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_3dd8bfc97e4a77c70971591bdcb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "branches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying(200) NOT NULL, CONSTRAINT "UQ_8387ed27b3d4ca53ec3fc7b029c" UNIQUE ("name"), CONSTRAINT "PK_7f37d3b42defea97f1df0d19535" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "credentialId" uuid, "profileId" uuid, CONSTRAINT "REL_4336f39b406d2bd9630afc8820" UNIQUE ("credentialId"), CONSTRAINT "REL_9466682df91534dd95e4dbaa61" UNIQUE ("profileId"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "credential" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, CONSTRAINT "PK_3a5169bcd3d5463cefeec78be82" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "credential_email_unique_active" ON "credential" ("email") WHERE "deletedAt" IS NULL`);
        await queryRunner.query(`CREATE TABLE "roles_permissions_permissions" ("rolesId" uuid NOT NULL, "permissionsId" uuid NOT NULL, CONSTRAINT "PK_b2f4e3f7fbeb7e5b495dd819842" PRIMARY KEY ("rolesId", "permissionsId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dc2b9d46195bb3ed28abbf7c9e" ON "roles_permissions_permissions" ("rolesId") `);
        await queryRunner.query(`CREATE INDEX "IDX_fd4d5d4c7f7ff16c57549b72c6" ON "roles_permissions_permissions" ("permissionsId") `);
        await queryRunner.query(`CREATE TABLE "branches_users_user" ("branchesId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_94b5da0fccd41ecc531cea421b8" PRIMARY KEY ("branchesId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_04058a1d29a9eb7dfd9f3603cd" ON "branches_users_user" ("branchesId") `);
        await queryRunner.query(`CREATE INDEX "IDX_68e13b75162a2f69b5d2e43fe7" ON "branches_users_user" ("userId") `);
        await queryRunner.query(`CREATE TABLE "user_roles_roles" ("userId" uuid NOT NULL, "rolesId" uuid NOT NULL, CONSTRAINT "PK_af39506d4797d25dbf41b29ea91" PRIMARY KEY ("userId", "rolesId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0d0cc409255467b0ac4fe6b169" ON "user_roles_roles" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_7521d8491e7c51f885e9f861e0" ON "user_roles_roles" ("rolesId") `);
        await queryRunner.query(`ALTER TABLE "refresh_token" ADD CONSTRAINT "FK_8fcf5b86f96fe076149fb6ceaab" FOREIGN KEY ("credentialId") REFERENCES "credential"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_4336f39b406d2bd9630afc8820d" FOREIGN KEY ("credentialId") REFERENCES "credential"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_9466682df91534dd95e4dbaa616" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "roles_permissions_permissions" ADD CONSTRAINT "FK_dc2b9d46195bb3ed28abbf7c9e3" FOREIGN KEY ("rolesId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "roles_permissions_permissions" ADD CONSTRAINT "FK_fd4d5d4c7f7ff16c57549b72c6f" FOREIGN KEY ("permissionsId") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "branches_users_user" ADD CONSTRAINT "FK_04058a1d29a9eb7dfd9f3603cd9" FOREIGN KEY ("branchesId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "branches_users_user" ADD CONSTRAINT "FK_68e13b75162a2f69b5d2e43fe73" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles_roles" ADD CONSTRAINT "FK_0d0cc409255467b0ac4fe6b1693" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_roles_roles" ADD CONSTRAINT "FK_7521d8491e7c51f885e9f861e02" FOREIGN KEY ("rolesId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_roles_roles" DROP CONSTRAINT "FK_7521d8491e7c51f885e9f861e02"`);
        await queryRunner.query(`ALTER TABLE "user_roles_roles" DROP CONSTRAINT "FK_0d0cc409255467b0ac4fe6b1693"`);
        await queryRunner.query(`ALTER TABLE "branches_users_user" DROP CONSTRAINT "FK_68e13b75162a2f69b5d2e43fe73"`);
        await queryRunner.query(`ALTER TABLE "branches_users_user" DROP CONSTRAINT "FK_04058a1d29a9eb7dfd9f3603cd9"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions_permissions" DROP CONSTRAINT "FK_fd4d5d4c7f7ff16c57549b72c6f"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions_permissions" DROP CONSTRAINT "FK_dc2b9d46195bb3ed28abbf7c9e3"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_9466682df91534dd95e4dbaa616"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_4336f39b406d2bd9630afc8820d"`);
        await queryRunner.query(`ALTER TABLE "refresh_token" DROP CONSTRAINT "FK_8fcf5b86f96fe076149fb6ceaab"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7521d8491e7c51f885e9f861e0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0d0cc409255467b0ac4fe6b169"`);
        await queryRunner.query(`DROP TABLE "user_roles_roles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_68e13b75162a2f69b5d2e43fe7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_04058a1d29a9eb7dfd9f3603cd"`);
        await queryRunner.query(`DROP TABLE "branches_users_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fd4d5d4c7f7ff16c57549b72c6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dc2b9d46195bb3ed28abbf7c9e"`);
        await queryRunner.query(`DROP TABLE "roles_permissions_permissions"`);
        await queryRunner.query(`DROP INDEX "public"."credential_email_unique_active"`);
        await queryRunner.query(`DROP TABLE "credential"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "branches"`);
        await queryRunner.query(`DROP TABLE "profile"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TYPE "public"."roles_role_enum"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
        await queryRunner.query(`DROP TYPE "public"."permissions_action_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c31d0a2f38e6e99110df62ab0a"`);
        await queryRunner.query(`DROP TABLE "refresh_token"`);
        await queryRunner.query(`DROP TYPE "public"."refresh_token_status_enum"`);
    }

}
