import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @MaxLength(255, { message: 'The email cannot exceed 255 characters' })
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'The password must contain at least 5 characters' })
  @MaxLength(100, { message: 'The password cannot exceed 100 characters' })
  @ApiProperty({ example: 'strong-password' })
  password: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  branches: string[];
}
