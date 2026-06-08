import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Credential } from "src/auth/entities/credential.entity";
import { Repository } from "typeorm";
import { LoginCredentialsDto } from "./dto/login-credentials.dto";
import * as bcrypt from "bcrypt"
import { RefreshToken } from "./entities/refresh-token.entity";
import { Request, Response } from 'express';

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
        const existingCredential = await this.credentialRepository.findOne({
            where: {email: loginCredential.email},
        })

        if(!existingCredential){
            return {message: "Invalid email or password"};
        }

        const validPass = await bcrypt.compare(loginCredential.password, existingCredential.password);

        if(!validPass){
            return {message: "Invalid email or password"};
        }

        const payload = { email: existingCredential.email, sub: existingCredential.id };

        const accessToken = await this.jwtService.signAsync(payload,{
            secret: process.env.JWT_SECRET,
            expiresIn: '15m'
        });

        const refreshTokenEntity = new RefreshToken();

        refreshTokenEntity.userAgent = req.headers['user-agent'] || 'unknown';
        refreshTokenEntity.ip =
        (req.headers['x-forwarded-for'] as string)
            ?.split(',')[0]
            ?.trim()
        || req.socket.remoteAddress
        || 'unknown';

        refreshTokenEntity.device = this.extractDevice(
            req.headers['user-agent'],
        );
       
        refreshTokenEntity.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        refreshTokenEntity.credential = existingCredential;

        await this.refreshTokenRepository.save(refreshTokenEntity);

        const refreshToken = await this.jwtService.signAsync(
            {
                sub: existingCredential.id,
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