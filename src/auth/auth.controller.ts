import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { UsersService } from "src/users/users.service";
import { AuthService } from "./auth.service";
import { Public} from "./decorators/is-public.decorator";
import { ApiBody } from "@nestjs/swagger";
import { CreateUserDto } from "src/users/dto/create-user.dto";
import { LoginCredentialsDto } from "./dto/login-credentials.dto";
import { Request, Response } from 'express';
import { RefreshTokenGuard } from "./guards/refresh-token.guard";
import { AppAbility, CheckPolicies } from "src/casl/decorators/check-policies.decorator";
import { Action } from "src/casl/enums/casl-action";

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

    @Post('/refresh')
    @Public()
    @UseGuards(RefreshTokenGuard)
    async refreshToken(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ){
        return await this.authService.refreshToken( req, res)
    }

    @Post('/logout')
    @Public()
    @UseGuards(RefreshTokenGuard)
    async logout(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ){
        return await this.authService.logout( req, res)
    }

    @Get('/auth-test')
    @CheckPolicies((ability: AppAbility) => ability.can(Action.Manage, "manage"))
    async authTest(){
        return {message: "You are authenticated"};
    }
}