import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Credential } from "src/auth/entities/credential.entity";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./guards/auth.guard";
import { Roles } from "src/roles/roles.entity";
import { User } from "src/users/users.entity";

@Module({
    imports: [TypeOrmModule.forFeature([User, Credential, Roles])],
    controllers: [AuthController],
    providers: [
        AuthService,
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        }
    ],
    exports:[]
})
export class AuthModule {}