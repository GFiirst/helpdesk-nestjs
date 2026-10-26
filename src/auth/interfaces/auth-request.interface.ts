import { Request } from 'express';
import { User } from '../../users/entity/user.entity';
import { Credential } from '../entities/credential.entity';
import { RefreshToken } from '../entities/refresh-token.entity';

export interface AccessTokenPayload {
  sub: string;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
}

export interface PasswordResetPayload {
  sub: string;
  purpose: 'password-reset';
  passwordVersion: string;
}

export interface AuthRequest extends Request {
  cookies: Record<string, string | undefined>;
  user?: User;
  credential?: Credential;
  refreshToken?: RefreshToken;
}
