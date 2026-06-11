import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class LoginCredentialsDto {
    @IsEmail()
    @IsNotEmpty()
    @MaxLength(255, { message: "Email must be at most 255 characters long" })
    @ApiProperty({example: "admin@gmail.com"})
    email: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255, { message: "Password must be at most 255 characters long" })
    @ApiProperty({example: "123"})
    password: string;
}