import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class createBranchDto{
    @IsString()
    @IsNotEmpty({ message: 'Branch name is required' })
    @MaxLength(200, { message: 'Branch name must be less than 200 characters' })
    @ApiProperty({ example: 'Branch name' })
    name: string;
}