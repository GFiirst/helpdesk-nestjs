import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Credential} from "../auth/entities/credential.entity";
import { Roles } from "src/roles/roles.entity";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { User } from "./users.entity";

@Module({
    imports: [TypeOrmModule.forFeature([User, Roles, Credential])],
    controllers:[UsersController],
    providers:[UsersService],
    exports:[UsersService]
})
export class UsersModule{}