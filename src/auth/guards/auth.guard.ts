import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { IS_PUBLIC_KEY } from '../decorators/is-public.decorator';
import { AccessTokenPayload, AuthRequest } from '../interfaces/auth-request.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    const token = this.extractTokenFromCookie(req);

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);

    if (isPublic) {
      return true;
    }

    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });

      const user = await this.usersService.findByIdWithRolesAndPermissions(payload.sub);

      if (!user) {
        throw new UnauthorizedException();
      }

      req.user = user;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
  private extractTokenFromCookie(request: AuthRequest): string | undefined {
    return request.cookies?.access_token;
  }
}
