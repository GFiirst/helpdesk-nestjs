import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./users.entity";
import { Repository } from "typeorm";
import { CreateUserDto } from "./dto/create-user.dto";
import * as bcrypt from "bcrypt";
import { Roles } from "src/roles/roles.entity";
import { UserRoles } from "src/roles/enums/user-roles";

@Injectable()
export class UsersService {
    
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Roles)
        private rolesRepository: Repository<Roles>,
    ){}

    async createUser(createUser: CreateUserDto) {
        const newUser = new User();

        const existingEmail = await this.userRepository.findOne({ 
            where: { 
                email: createUser.email 
            } 
        });

        if (existingEmail) {
            throw new BadRequestException("Email already exists");
        }

        const userPass = createUser.password;
        const criptPass = await bcrypt.hash(userPass, +process.env.BCRYPT_SALT!);

        newUser.name = createUser.name;
        newUser.email = createUser.email;
        newUser.password = criptPass;
        
        const userRole = await this.rolesRepository.findOne({
            where:{
                role: UserRoles.USER
            },
        })

        if(!userRole){
            throw new BadRequestException("User role not found");
        }
        newUser.roles = [userRole];

        await this.userRepository.save(newUser);
        return{
            message: "User created successfully"
        }
    }
}