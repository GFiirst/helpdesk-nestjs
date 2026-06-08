import { InjectRepository } from "@nestjs/typeorm";
import { RefreshToken } from "../entities/refresh-token.entity";
import { JwtService } from "@nestjs/jwt";
import { Repository } from "typeorm";
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { TokenStatus } from "../enums/token-status";
import * as bcrypt from "bcrypt";

@Injectable()
export class RefreshTokenGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
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
                where: {
                    id: payload.tokenId,
                },
                relations: ['credential'],
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

            const isMatch = await bcrypt.compare(
                token,
                storedToken.token,
            );

            if (!isMatch) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            req['credential'] = storedToken.credential;
            req['refreshToken'] = storedToken;

            return true;
        } catch (err) {
            throw new UnauthorizedException();
        }
    }
}