import { ApiProperty } from '@nestjs/swagger';

export class AuthenticatedUserDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: ['user'], isArray: true })
  roles: string[];
}

export class LoginResponseDto {
  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt: Date;

  @ApiProperty({ type: AuthenticatedUserDto })
  userInfo: AuthenticatedUserDto;
}

export class RefreshResponseDto {
  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt: Date;
}
