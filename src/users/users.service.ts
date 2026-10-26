import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Credential)
    private credentialRepository: Repository<Credential>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async createUser(dto: CreateUserDto) {
    return await this.dataSource.transaction(async (manager) => {
      const existingEmail = await manager.findOne(Credential, {
        where: { email: dto.email.trim().toLowerCase() },
      });

      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }

      const hashedPassword = await bcrypt.hash(
        dto.password,
        this.configService.getOrThrow<number>('BCRYPT_SALT'),
      );

      const credential = manager.create(Credential, {
        email: dto.email.trim().toLowerCase(),
        password: hashedPassword,
      });

      await manager.save(credential);

      const role = await manager.findOne(Roles, {
        where: { role: UserRoles.USER },
      });

      if (!role) {
        throw new NotFoundException('Default role not found');
      }

      const branches = await manager.find(Branches, {
        where: { id: In(dto.branches) },
      });

      if (branches.length !== dto.branches.length) {
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
      email: user.credential?.email,
      roles: user.roles?.map((role) => role.role) ?? [],
    };
  }
}
