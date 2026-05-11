import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MaxLength } from "class-validator";
import { UserRoles } from "src/roles/enums/user-roles";

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200, { message: "The name cannot exceed 200 characters" })
    @ApiProperty()
    name: string;

    @IsEmail()
    @MaxLength(200, { message: "The email cannot exceed 200 characters" })
    @ApiProperty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(200, { message: "The password cannot exceed 200 characters" })
    @ApiProperty()
    password: string;

    @ApiProperty()
    role: UserRoles;
}