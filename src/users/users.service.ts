import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Credential } from "../auth/entities/credential.entity";
import { Repository } from "typeorm";
import { CreateUserDto } from "./dto/create-user.dto";
import * as bcrypt from "bcrypt";
import { Roles } from "src/roles/roles.entity";
import { UserRoles } from "src/roles/enums/user-roles";
import { User } from "./entity/users.entity";

@Injectable()
export class UsersService {
    
    constructor(
        @InjectRepository(Credential)
        private credentialRepository: Repository<Credential>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Roles)
        private rolesRepository: Repository<Roles>,
    ){}

    async createUser(createUser: CreateUserDto) {
        const existingEmail = await this.credentialRepository.findOne({
            where: { email: createUser.email },
        });

        if (existingEmail) {
            throw new BadRequestException("Email already exists");
        }

        const hashedPassword = await bcrypt.hash(
            createUser.password,
            Number(process.env.BCRYPT_SALT),
        );

        const credential = this.credentialRepository.create({
            email: createUser.email,
            password: hashedPassword,
        });

        const role = await this.rolesRepository.findOne({
            where: { role: UserRoles.USER },
        });

        if (!role) {
            throw new NotFoundException("Default role not found");
        }

        const user = this.userRepository.create({
            credential,
            roles: [role],
        });

        await this.userRepository.save(user);

        return { message: "User created successfully" };
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