import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Credential } from '../auth/entities/credential.entity';
import { DataSource, In, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { Roles } from 'src/roles/roles.entity';
import { UserRoles } from 'src/roles/enums/user-roles';
import { User } from './entity/user.entity';
import { Branches } from 'src/branches/branches.entity';
import { FieldEncryptionService } from 'src/security/field-encryption.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(Credential)
    private credentialRepository: Repository<Credential>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly fieldEncryptionService: FieldEncryptionService,
  ) {}

  async createUser(dto: CreateUserDto) {
    this.logger.log('User creation started');
    const result = await this.dataSource.transaction(async (manager) => {
      const normalizedEmail = this.fieldEncryptionService.normalizeEmail(dto.email);
      const emailHash = this.fieldEncryptionService.hashEmail(normalizedEmail);
      const existingEmail = await manager.findOne(Credential, {
        where: { emailHash },
      });

      if (existingEmail) {
        this.logger.warn('User creation failed: Email already exists');
        throw new ConflictException('Email already exists');
      }

      const hashedPassword = await bcrypt.hash(dto.password, this.configService.getOrThrow<number>('BCRYPT_SALT'));

      const credential = manager.create(Credential, {
        emailEncrypted: this.fieldEncryptionService.encrypt(normalizedEmail),
        emailHash,
        password: hashedPassword,
      });

      await manager.save(credential);

      const role = await manager.findOne(Roles, {
        where: { role: UserRoles.USER },
      });

      if (!role) {
        this.logger.error('User creation failed: Default role not found');
        throw new NotFoundException('Default role not found');
      }

      const branches = await manager.find(Branches, {
        where: { id: In(dto.branches) },
      });

      if (branches.length !== dto.branches.length) {
        this.logger.warn('User creation failed: One or more branches are invalid');
        throw new BadRequestException('One or more branches are invalid.');
      }

      const user = manager.create(User, {
        credential,
        roles: [role],
        branches,
      });

      await manager.save(user);

      return { message: 'User created successfully' };
    });
    this.logger.log('User creation succeeded');
    return result;
  }

  async findByIdWithRolesAndPermissions(id: string) {
    const user = await this.userRepository.findOne({
      where: {
        id: id,
      },
      relations: {
        credential: true,
        roles: {
          permissions: true,
        },
      },
    });

    return user;
  }

  toResponse(user: User) {
    return {
      id: user.id,
      email: user.credential?.emailEncrypted ? this.fieldEncryptionService.decrypt(user.credential.emailEncrypted) : undefined,
      roles: user.roles?.map((role) => role.role) ?? [],
    };
  }
}
