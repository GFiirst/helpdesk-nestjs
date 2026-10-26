import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsJWT()
  @ApiProperty({ description: 'Password reset token received by email' })
  token: string;

  @IsString()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty({ example: 'new-strong-password' })
  newPassword: string;
}
