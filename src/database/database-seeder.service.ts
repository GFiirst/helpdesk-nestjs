import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { EntityManager, DataSource } from 'typeorm';
import { Credential } from '../auth/entities/credential.entity';
import { Branches } from '../branches/branches.entity';
import { Action } from '../casl/enums/casl-action';
import { Subjects } from '../casl/enums/casl-subject';
import { Permissions } from '../permissions/permissions.entity';
import { PERMISSIONS } from '../permissions/permissions.map';
import { UserRoles } from '../roles/enums/user-roles';
import { Roles } from '../roles/roles.entity';
import { FieldEncryptionService } from '../security/field-encryption.service';
import { Profile } from '../users/entity/profile.entity';
import { User } from '../users/entity/user.entity';

interface PermissionDefinition {
  action: Action;
  roles: UserRoles[];
  subject: Subjects;
}

@Injectable()
export class DatabaseSeederService {
  private readonly logger = new Logger(DatabaseSeederService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly fieldEncryptionService: FieldEncryptionService,
  ) {}

  async seed(): Promise<void> {
    if (!this.configService.getOrThrow<boolean>('SEED_DATABASE_ON_STARTUP')) {
      this.logger.log('Database seeding is disabled');
      return;
    }

    const startedAt = Date.now();
    this.logger.log('Database seeding started');

    try {
      await this.dataSource.transaction(async (manager) => {
        await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['helpdesk-database-seeder']);

        const branchCreated = await this.seedAdminBranch(manager);
        this.logger.log(`Branch seeder completed. Created: ${branchCreated ? 1 : 0}`);

        const rolesCreated = await this.seedRoles(manager);
        this.logger.log(`Role seeder completed. Created: ${rolesCreated}`);

        const permissionsChanged = await this.syncPermissions(manager);
        this.logger.log(`Permission seeder completed. Created: ${permissionsChanged.created}, removed: ${permissionsChanged.removed}`);

        const adminCreated = await this.seedAdminUser(manager);
        this.logger.log(`Admin user seeder completed. Created: ${adminCreated ? 1 : 0}`);
      });
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error('Database seeding failed', stack);
      throw error;
    }

    this.logger.log(`Database seeding completed in ${Date.now() - startedAt}ms`);
  }

  private async seedAdminBranch(manager: EntityManager): Promise<boolean> {
    const branchName = this.configService.get<string>('ADMIN_BRANCH')?.trim();
    if (!branchName) {
      this.logger.warn('Admin branch seed skipped: ADMIN_BRANCH is not configured');
      return false;
    }

    const existingBranch = await manager.findOne(Branches, { where: { name: branchName } });
    if (existingBranch) return false;

    await manager.save(Branches, manager.create(Branches, { name: branchName }));
    return true;
  }

  private async seedRoles(manager: EntityManager): Promise<number> {
    const existingRoles = await manager.find(Roles);
    const existingRoleNames = new Set(existingRoles.map((role) => role.role));
    const missingRoles = Object.values(UserRoles)
      .filter((role) => !existingRoleNames.has(role))
      .map((role) => manager.create(Roles, { role }));

    if (missingRoles.length) await manager.save(Roles, missingRoles);
    return missingRoles.length;
  }

  private async syncPermissions(manager: EntityManager): Promise<{ created: number; removed: number }> {
    const definitions = this.permissionDefinitions();
    const roles = await manager.find(Roles, { relations: { permissions: true } });
    const existingPermissions = await manager.find(Permissions);
    const permissionByKey = new Map<string, Permissions>();
    const obsoletePermissions: Permissions[] = [];

    for (const permission of existingPermissions) {
      const key = this.permissionKey(permission.subject, permission.action);
      if (
        definitions.some((definition) => this.permissionKey(definition.subject, definition.action) === key) &&
        !permissionByKey.has(key)
      ) {
        permissionByKey.set(key, permission);
      } else {
        obsoletePermissions.push(permission);
      }
    }

    const newPermissions = definitions
      .filter((definition) => !permissionByKey.has(this.permissionKey(definition.subject, definition.action)))
      .map((definition) => manager.create(Permissions, { subject: definition.subject, action: definition.action }));

    if (newPermissions.length) {
      const savedPermissions = await manager.save(Permissions, newPermissions);
      savedPermissions.forEach((permission) => permissionByKey.set(this.permissionKey(permission.subject, permission.action), permission));
    }

    for (const role of roles) {
      role.permissions = definitions
        .filter((definition) => definition.roles.includes(role.role))
        .map((definition) => permissionByKey.get(this.permissionKey(definition.subject, definition.action))!);
    }
    if (roles.length) await manager.save(Roles, roles);
    if (obsoletePermissions.length) await manager.remove(Permissions, obsoletePermissions);

    return { created: newPermissions.length, removed: obsoletePermissions.length };
  }

  private async seedAdminUser(manager: EntityManager): Promise<boolean> {
    const name = this.configService.get<string>('ADMIN_NAME')?.trim();
    const email = this.configService.get<string>('ADMIN_EMAIL')?.trim();
    const password = this.configService.get<string>('ADMIN_PASSWORD');
    const branchName = this.configService.get<string>('ADMIN_BRANCH')?.trim();

    if (!name || !email || !password || !branchName) {
      this.logger.warn('Admin user seed skipped: Admin configuration is incomplete');
      return false;
    }

    const normalizedEmail = this.fieldEncryptionService.normalizeEmail(email);
    const emailHash = this.fieldEncryptionService.hashEmail(normalizedEmail);
    const existingCredential = await manager.findOne(Credential, { where: { emailHash } });
    if (existingCredential) return false;

    const adminRole = await manager.findOne(Roles, { where: { role: UserRoles.ADMIN } });
    const adminBranch = await manager.findOne(Branches, { where: { name: branchName } });
    if (!adminRole || !adminBranch) throw new Error('Admin role or branch was not created');

    const credential = await manager.save(
      Credential,
      manager.create(Credential, {
        emailEncrypted: this.fieldEncryptionService.encrypt(normalizedEmail),
        emailHash,
        password: await bcrypt.hash(password, this.configService.getOrThrow<number>('BCRYPT_SALT')),
      }),
    );
    const profile = await manager.save(Profile, manager.create(Profile, { name }));
    await manager.save(User, manager.create(User, { branches: [adminBranch], credential, profile, roles: [adminRole] }));
    return true;
  }

  private permissionDefinitions(): PermissionDefinition[] {
    return Object.values(PERMISSIONS)
      .flat()
      .map(({ permissions, roles }) => {
        const [subject, action] = permissions.split('.') as [Subjects, Action];
        return { subject, action, roles: [...roles] };
      });
  }

  private permissionKey(subject: Subjects, action: Action): string {
    return `${subject}.${action}`;
  }
}
