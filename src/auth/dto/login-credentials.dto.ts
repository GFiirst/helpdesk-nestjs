import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginCredentialsDto {
  @IsEmail()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsNotEmpty()
  @MaxLength(255, { message: 'Email must be at most 255 characters long' })
  @ApiProperty({ example: 'admin@gmail.com' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Password must be at least 5 characters long' })
  @MaxLength(255, { message: 'Password must be at most 255 characters long' })
  @ApiProperty({ example: 'strong-password' })
  password: string;
}
