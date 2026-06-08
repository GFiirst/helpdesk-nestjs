import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MaxLength } from "class-validator";
import { UserRoles } from "src/roles/enums/user-roles";

export class CreateUserDto {
    @IsEmail()
    @MaxLength(255, { message: "The email cannot exceed 255 characters" })
    @ApiProperty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255, { message: "The password cannot exceed 255 characters" })
    @ApiProperty()
    password: string;

    @ApiProperty()
    role: UserRoles;
}