import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { Response } from 'express';
import { Credential } from 'src/auth/entities/credential.entity';
import { Repository } from 'typeorm';
import { LoginCredentialsDto } from './dto/login-credentials.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import { TokenStatus } from './enums/token-status';
import {
  AuthRequest,
  RefreshTokenPayload,
} from './interfaces/auth-request.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Credential)
    private credentialRepository: Repository<Credential>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(
    loginCredential: LoginCredentialsDto,
    req: AuthRequest,
    res: Response,
  ) {
    const existingRefreshToken = req.cookies?.refresh_token;

    if (existingRefreshToken) {
      try {
        const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
          existingRefreshToken,
          {
            secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
          },
        );

        const storedToken = await this.refreshTokenRepository.findOne({
          where: {
            id: payload.tokenId,
          },
        });

        if (
          storedToken &&
          this.tokenMatches(existingRefreshToken, storedToken.tokenHash)
        ) {
          storedToken.status = TokenStatus.REVOKED;

          await this.refreshTokenRepository.save(storedToken);
        }
      } catch {
        // Invalid or expired cookies are replaced by the new session.
      }

      this.clearAuthCookies(res);
    }

    const existingCredential = await this.credentialRepository.findOne({
      where: { email: loginCredential.email.trim().toLowerCase() },
      relations: ['user', 'user.roles'],
    });

    if (!existingCredential) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const validPass = await bcrypt.compare(
      loginCredential.password,
      existingCredential.password,
    );

    if (!validPass) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const maxSessions = this.configService.getOrThrow<number>(
      'MAX_ACTIVE_SESSIONS',
    );

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

    if (activeSessions.length >= maxSessions) {
      const oldestSession = activeSessions[0];
      oldestSession.status = TokenStatus.REVOKED;
      await this.refreshTokenRepository.save(oldestSession);
    }

    const payload = {
      email: existingCredential.email,
      sub: existingCredential.user.id,
    };

    const accessExpirationMinutes = this.configService.getOrThrow<number>(
      'JWT_ACCESS_EXPIRATION_MINUTES',
    );
    const refreshExpirationDays = this.configService.getOrThrow<number>(
      'JWT_REFRESH_EXPIRATION_DAYS',
    );
    const accessExpiresAt = new Date(
      Date.now() + accessExpirationMinutes * 60_000,
    );
    const refreshExpiresAt = new Date(
      Date.now() + refreshExpirationDays * 86_400_000,
    );

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: accessExpirationMinutes * 60,
    });

    const refreshTokenEntity = new RefreshToken();

    refreshTokenEntity.tokenHash = randomBytes(32).toString('hex');
    refreshTokenEntity.userAgent = req.headers['user-agent'] || 'unknown';
    refreshTokenEntity.ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';
    refreshTokenEntity.device = this.extractDevice(req.headers['user-agent']);
    refreshTokenEntity.expiresAt = refreshExpiresAt;
    refreshTokenEntity.credential = existingCredential;

    await this.refreshTokenRepository.save(refreshTokenEntity);

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: existingCredential.user.id,
        tokenId: refreshTokenEntity.id,
      },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpirationDays * 86_400,
      },
    );

    refreshTokenEntity.tokenHash = this.hashToken(refreshToken);
    await this.refreshTokenRepository.save(refreshTokenEntity);

    this.setCookie(res, 'access_token', accessToken, accessExpiresAt);
    this.setCookie(res, 'refresh_token', refreshToken, refreshExpiresAt);

    return {
      expiresAt: accessExpiresAt,
      userInfo: this.toAuthenticatedUser(existingCredential),
    };
  }

  async refreshToken(req: AuthRequest, res: Response) {
    const credential = req.credential;

    if (!credential) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    const payload = {
      email: credential.email,
      sub: credential.user.id,
    };

    const expirationMinutes = this.configService.getOrThrow<number>(
      'JWT_ACCESS_EXPIRATION_MINUTES',
    );
    const expiresAt = new Date(Date.now() + expirationMinutes * 60_000);
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: expirationMinutes * 60,
    });

    this.setCookie(res, 'access_token', accessToken, expiresAt);

    return {
      expiresAt,
    };
  }

  async logout(req: AuthRequest, res: Response) {
    const refreshToken = req.cookies?.refresh_token;

    if (refreshToken) {
      try {
        const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
          refreshToken,
          {
            secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
          },
        );

        const storedToken = await this.refreshTokenRepository.findOne({
          where: {
            id: payload.tokenId,
          },
        });

        if (
          storedToken &&
          this.tokenMatches(refreshToken, storedToken.tokenHash)
        ) {
          storedToken.status = TokenStatus.REVOKED;

          await this.refreshTokenRepository.save(storedToken);
        }
      } catch {
        // Logout remains idempotent when the cookie is invalid or expired.
      }
    }

    this.clearAuthCookies(res);

    return {
      success: true,
    };
  }

  private extractDevice(userAgent?: string): string {
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

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private tokenMatches(token: string, storedHash: string): boolean {
    const incomingHash = Buffer.from(this.hashToken(token), 'hex');
    const expectedHash = Buffer.from(storedHash, 'hex');

    return (
      incomingHash.length === expectedHash.length &&
      timingSafeEqual(incomingHash, expectedHash)
    );
  }

  private cookieOptions(expires?: Date) {
    return {
      httpOnly: true,
      secure: this.configService.getOrThrow<boolean>('COOKIE_SECURE'),
      sameSite: 'strict' as const,
      path: '/',
      ...(expires ? { expires } : {}),
    };
  }

  private setCookie(
    response: Response,
    name: 'access_token' | 'refresh_token',
    value: string,
    expires: Date,
  ): void {
    response.cookie(name, value, this.cookieOptions(expires));
  }

  private clearAuthCookies(response: Response): void {
    response.clearCookie('access_token', this.cookieOptions());
    response.clearCookie('refresh_token', this.cookieOptions());
  }

  private toAuthenticatedUser(credential: Credential) {
    return {
      id: credential.user.id,
      email: credential.email,
      roles: credential.user.roles?.map((role) => role.role) ?? [],
    };
  }
}
