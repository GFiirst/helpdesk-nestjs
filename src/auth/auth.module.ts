import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Credential } from "src/auth/entities/credential.entity";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./guards/auth.guard";
import { Roles } from "src/roles/roles.entity";
import { User } from "src/users/entity/user.entity";
import { UsersService } from "src/users/users.service";
import { RefreshToken } from "./entities/refresh-token.entity";

@Module({
    imports: [TypeOrmModule.forFeature([User, Credential, Roles, RefreshToken])],
    controllers: [AuthController],
    providers: [
        AuthService, UsersService,
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        }
    ],
    exports:[]
})
export class AuthModule {}