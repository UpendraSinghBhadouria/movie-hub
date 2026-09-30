import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import type { Request, Response } from 'express';

import { AuthService } from './auth.service.js';

import {
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_EXPIRES_IN_MS,
} from '../common/constants/app.constants.js';

import { ERROR_CODES } from '../common/constants/error-codes.constants.js';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';

import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

import { AccessTokenGuard } from '../common/guards/access-token.guard.js';

import type { AuthenticatedUser } from '../common/types/auth.types.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true })
    response: Response,
  ) {
    const result = await this.authService.register(dto);

    const refreshToken = await this.authService.createAndStoreRefreshToken(
      result.user.id,
    );

    this.setRefreshTokenCookie(response, refreshToken);

    return result;
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true })
    response: Response,
  ) {
    const result = await this.authService.login(dto);

    const refreshToken = await this.authService.createAndStoreRefreshToken(
      result.user.id,
    );

    this.setRefreshTokenCookie(response, refreshToken);

    return result;
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true })
    response: Response,
  ) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE] as
      string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException({
        message: 'Refresh token is missing',
        err_code: ERROR_CODES.AUTHENTICATION_FAILED,
      });
    }

    const result = await this.authService.refresh(refreshToken);

    this.setRefreshTokenCookie(response, result.refreshToken);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true })
    response: Response,
  ) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE] as
      string | undefined;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    response.clearCookie(REFRESH_TOKEN_COOKIE, this.getCookieOptions());

    return {
      success: true,
      data: null,
      message: 'Logged out successfully',
    };
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  async me(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    const currentUser = await this.authService.getCurrentUser(user.id);

    return currentUser;
  }

  private setRefreshTokenCookie(
    response: Response,
    refreshToken: string,
  ): void {
    response.cookie(
      REFRESH_TOKEN_COOKIE,
      refreshToken,
      this.getCookieOptions(),
    );
  }

  private getCookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ('none' as const) : ('lax' as const),
      path: '/api/auth',
      maxAge: REFRESH_TOKEN_EXPIRES_IN_MS,
    };
  }
}
