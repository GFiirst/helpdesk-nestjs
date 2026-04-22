import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./users.entity";
import { Repository } from "typeorm";

@Injectable()
export class UsersService {
    
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ){}

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