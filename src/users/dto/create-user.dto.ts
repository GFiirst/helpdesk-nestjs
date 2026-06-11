import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsEmail, IsNotEmpty, IsString, IsUUID, MaxLength } from "class-validator";
import { UserRoles } from "src/roles/enums/user-roles";

export class CreateUserDto {
    @IsEmail()
    @MaxLength(255, { message: "The email cannot exceed 255 characters" })
    @ApiProperty({example: "user@example.com"})
    email: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255, { message: "The password cannot exceed 255 characters" })
    @ApiProperty({example: "123"})
    password: string;

    @IsArray()
    @ArrayNotEmpty()
    @IsUUID("4", { each: true })
    branches: string[];
}