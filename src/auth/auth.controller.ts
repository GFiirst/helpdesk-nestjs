import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import {
  AppAbility,
  CheckPolicies,
} from 'src/casl/decorators/check-policies.decorator';
import { Action } from 'src/casl/enums/casl-action';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';
import { Public } from './decorators/is-public.decorator';
import {
  AuthenticatedUserDto,
  LoginResponseDto,
  RefreshResponseDto,
} from './dto/auth-response.dto';
import { LoginCredentialsDto } from './dto/login-credentials.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { AuthRequest } from './interfaces/auth-request.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('sign-up')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, 'user'))
  @Throttle({ default: { limit: 5, ttl: 300_000 } })
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Create a user' })
  @ApiCreatedResponse({ description: 'User created' })
  async signUp(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Post('login')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 300_000 } })
  @ApiOperation({ summary: 'Authenticate and create a session' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  async login(
    @Body() loginCredential: LoginCredentialsDto,
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(loginCredential, request, response);
  }

  @Post('refresh')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 300_000 } })
  @UseGuards(RefreshTokenGuard)
  @ApiOperation({ summary: 'Renew the access token' })
  @ApiOkResponse({ type: RefreshResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  async refreshToken(
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.refreshToken(request, response);
  }

  @Post('logout')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 300_000 } })
  @ApiOperation({ summary: 'Revoke the current session' })
  @ApiOkResponse({ schema: { example: { success: true } } })
  async logout(
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logout(request, response);
  }

  @Get('validate')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Validate the authenticated session' })
  @ApiOkResponse({ type: AuthenticatedUserDto })
  validate(@Req() request: AuthRequest) {
    return this.usersService.toResponse(request.user!);
  }
}
