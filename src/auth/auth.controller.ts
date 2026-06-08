import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import { UsersService } from "src/users/users.service";
import { AuthService } from "./auth.service";
import { Public} from "./decorators/is-public.decorator";
import { ApiBody } from "@nestjs/swagger";
import { CreateUserDto } from "src/users/dto/create-user.dto";
import { LoginCredentialsDto } from "./dto/login-credentials.dto";
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private usersService: UsersService
    ) {}

    @Post('/sign-up')
    @Public()
    @ApiBody({type: CreateUserDto})
    async signUp(
        @Body() createUserDto: CreateUserDto
    ){
        return await this.usersService.createUser(createUserDto);
    }

    @Post('/login')
    @Public()
    @ApiBody({type: LoginCredentialsDto})
    async login(
        @Body() loginCredential: LoginCredentialsDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ){
        return await this.authService.login(loginCredential, req, res);
    }
}