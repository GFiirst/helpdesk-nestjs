import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Credential } from "../auth/entities/credential.entity";
import { DataSource, In, Repository } from "typeorm";
import { CreateUserDto } from "./dto/create-user.dto";
import * as bcrypt from "bcrypt";
import { Roles } from "src/roles/roles.entity";
import { UserRoles } from "src/roles/enums/user-roles";
import { User } from "./entity/user.entity";
import { Profile } from "./entity/profile.entity";
import { Branches } from "src/branches/branches.entity";

@Injectable()
export class UsersService {
    
    constructor(
        @InjectRepository(Credential)
        private credentialRepository: Repository<Credential>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private readonly dataSource: DataSource,
    ){}

    async createUser(dto: CreateUserDto) {
        return await this.dataSource.transaction(async (manager) => {

            const existingEmail = await manager.findOne(Credential, {
                where: { email: dto.email },
            });

            if (existingEmail) {
                throw new BadRequestException("Email already exists");
            }

            const hashedPassword = await bcrypt.hash(
                dto.password,
                Number(process.env.BCRYPT_SALT),
            );

            const credential = manager.create(Credential, {
                email: dto.email,
                password: hashedPassword,
            });

            await manager.save(credential);

            const role = await manager.findOne(Roles, {
                where: { role: UserRoles.USER },
            });

            if (!role) {
                throw new NotFoundException("Default role not found");
            }

            const branches = await manager.find(Branches, {
                where: { id: In(dto.branches) },
            });

            if (branches.length !== dto.branches.length) {
                throw new BadRequestException("One or more branches are invalid.");
            }

            const user = manager.create(User, {
                credential,
                roles: [role],
                branches,
            });

            await manager.save(user);

            return { message: "User created successfully" };
        });
    }

    async findByIdWithRolesAndPermissions(id: string) {
    const user = await this.userRepository.findOne({
        where: {
            id: id
        },
        relations: {
            roles: {
                permissions: true
            }
        }
    })

        return user
    }
}