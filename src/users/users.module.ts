import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Credential} from "../auth/entities/credential.entity";
import { Roles } from "src/roles/roles.entity";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { User } from "./entity/user.entity";
import { Branches } from "src/branches/branches.entity";

@Module({
    imports: [TypeOrmModule.forFeature([User, Roles, Credential, Branches])],
    controllers:[UsersController],
    providers:[UsersService],
    exports:[UsersService]
})
export class UsersModule{}