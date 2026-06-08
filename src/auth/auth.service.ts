import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Credential } from "src/auth/entities/credential.entity";
import { Repository } from "typeorm";
import { LoginCredentialsDto } from "./dto/login-credentials.dto";
import * as bcrypt from "bcrypt"
import { RefreshToken } from "./entities/refresh-token.entity";
import { Request, Response } from 'express';
import { TokenStatus } from "./enums/token-status";

@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(Credential)
        private credentialRepository: Repository<Credential>,
        @InjectRepository(RefreshToken)
        private refreshTokenRepository: Repository<RefreshToken>,
        private jwtService: JwtService
    ){}

    async login(
        loginCredential: LoginCredentialsDto,
        req: Request,
        res: Response,
    ){  

        const existingRefreshToken = req.cookies?.refresh_token;

        if (existingRefreshToken) {
            try {
                const payload = await this.jwtService.verifyAsync(
                    existingRefreshToken,
                    {
                        secret: process.env.JWT_REFRESH_SECRET,
                    },
                );

                const storedToken = await this.refreshTokenRepository.findOne({
                    where: {
                        id: payload.tokenId,
                    },
                });

                if (storedToken) {
                    storedToken.status = TokenStatus.REVOKED;

                    await this.refreshTokenRepository.save(storedToken);
                }
            } catch (err) {}

            res.clearCookie('refresh_token');
            res.clearCookie('access_token');
        }

        const existingCredential = await this.credentialRepository.findOne({
            where: {email: loginCredential.email},
            relations: ['user'],
        })

        if(!existingCredential){
            return {message: "Invalid email or password"};
        }

        const validPass = await bcrypt.compare(loginCredential.password, existingCredential.password);

        if(!validPass){
            return {message: "Invalid email or password"};
        }

        const MAX_SESSIONS = 5;

        const activeSessions = await this.refreshTokenRepository.find({
            where: {
                credential: {
                    id: existingCredential.id,
                },
                status: TokenStatus.ACTIVE,
            },
            order: {
                createdAt: 'ASC',
            },
        });

        if (activeSessions.length >= MAX_SESSIONS) {
            const oldestSession = activeSessions[0];
            oldestSession.status = TokenStatus.REVOKED;
            await this.refreshTokenRepository.save(oldestSession);
        }

        const payload = { email: existingCredential.email, sub: existingCredential.user.id };

        const accessToken = await this.jwtService.signAsync(payload,{
            secret: process.env.JWT_SECRET,
            expiresIn: '15m'
        });

        const refreshTokenEntity = new RefreshToken();

        refreshTokenEntity.token = 'pending';
        refreshTokenEntity.userAgent = req.headers['user-agent'] || 'unknown';
        refreshTokenEntity.ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()|| req.socket.remoteAddress || 'unknown';
        refreshTokenEntity.device = this.extractDevice(req.headers['user-agent']);
        refreshTokenEntity.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        refreshTokenEntity.credential = existingCredential;

        await this.refreshTokenRepository.save(refreshTokenEntity);

        const refreshToken = await this.jwtService.signAsync(
            {
                sub: existingCredential.user.id,
                tokenId: refreshTokenEntity.id,
            },
            {
                secret: process.env.JWT_REFRESH_SECRET,
                expiresIn: '30d',
            },
        );

        refreshTokenEntity.token = await bcrypt.hash(refreshToken, Number(process.env.BCRYPT_SALT));
        await this.refreshTokenRepository.save(refreshTokenEntity);

        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
        });

        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
        });

        return {
            success: true,
        };
    }

    async refreshToken( 
        req: Request,
        res: Response
    ){
        const credential = req['credential'] as Credential;

        const payload = {
            email: credential.email,
            sub: credential.user.id,
        };

        const accessToken = await this.jwtService.signAsync(payload,{
            secret: process.env.JWT_SECRET,
            expiresIn: '15m'
        });

        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
        });

        return {
            success: true,
        };
    }

    async logout(
        req: Request,
        res: Response
    ){
        const refreshToken = req['refreshToken'];

        refreshToken.status = TokenStatus.REVOKED;

        await this.refreshTokenRepository.save(
            refreshToken
        );

        res.clearCookie('access_token', {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
        });

        res.clearCookie('refresh_token', {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
        });

        return {
            success: true,
        };
    }

    private extractDevice(
        userAgent?: string,
    ): string {
        if (!userAgent) {
            return 'Unknown';
        }

        if (userAgent.includes('Windows')) {
            return 'Windows';
        }

        if (userAgent.includes('Android')) {
            return 'Android';
        }

        if (userAgent.includes('iPhone')) {
            return 'iPhone';
        }

        if (userAgent.includes('Mac')) {
            return 'Mac';
        }

        if (userAgent.includes('Linux')) {
            return 'Linux';
        }

        return 'Unknown';
    }
}