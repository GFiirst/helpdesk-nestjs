import { InjectRepository } from "@nestjs/typeorm";
import { RefreshToken } from "../entities/refresh-token.entity";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "src/users/users.service";
import { Repository } from "typeorm";
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { TokenStatus } from "../enum/token-status";

@Injectable()
export class RefreshTokenGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private usersService: UsersService,
        @InjectRepository(RefreshToken)
        private refreshTokenRepo: Repository<RefreshToken>,
    ) {}

    async canActivate(context: ExecutionContext) {
        const req = context.switchToHttp().getRequest();
        const token = req.cookies?.refresh_token;

        if (!token) {
            throw new UnauthorizedException('Refresh token not found');
        }

        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_REFRESH_SECRET,
            });

            const storedToken = await this.refreshTokenRepo.findOne({
                where: { token },
                relations: ['user'],
            });

            if (!storedToken) {
                throw new UnauthorizedException('invalid Refresh token');
            }

            if (storedToken.status !== TokenStatus.ACTIVE) {
                throw new UnauthorizedException('revoked Refresh token');
            }

            if (new Date() > storedToken.expiresAt) {
                throw new UnauthorizedException('expired Refresh token');
            }

            req['user'] = storedToken.user;
            req['refreshToken'] = storedToken;

            return true;
        } catch (err) {
            throw new UnauthorizedException();
        }
    }
}