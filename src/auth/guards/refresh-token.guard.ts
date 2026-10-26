import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenStatus } from '../enums/token-status';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';
import {
  AuthRequest,
  RefreshTokenPayload,
} from '../interfaces/auth-request.interface';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    const token = req.cookies?.refresh_token;

    if (!token) {
      throw new UnauthorizedException('Refresh token not found');
    }

    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        token,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );

      const storedToken = await this.refreshTokenRepo.findOne({
        where: {
          id: payload.tokenId,
        },
        relations: ['credential', 'credential.user'],
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

      const incomingHash = Buffer.from(
        createHash('sha256').update(token).digest('hex'),
        'hex',
      );
      const storedHash = Buffer.from(storedToken.tokenHash, 'hex');
      const isMatch =
        incomingHash.length === storedHash.length &&
        timingSafeEqual(incomingHash, storedHash);

      if (!isMatch) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      req.credential = storedToken.credential;
      req.refreshToken = storedToken;

      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
