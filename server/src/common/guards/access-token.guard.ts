import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ERROR_CODES } from '../../common/constants/error-codes.constants.js';
import { TokenPayload, AuthenticatedUser } from '../types/auth.types.js';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: {
        authorization?: string;
      };
      user: AuthenticatedUser;
    }>();

    const authorization = request.headers.authorization;

    if (!authorization) {
      throw this.authenticationFailed();
    }

    const [type, token] = authorization.split(' ');

    if (type !== 'Bearer' || !token) {
      throw this.authenticationFailed();
    }

    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: this.getAccessTokenSecret(),
      });

      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        name: '',
        mobile: null,
      };

      return true;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          success: false,
          code: ERROR_CODES.TOKEN_EXPIRED,
          message: 'Access token has expired',
        });
      }

      throw this.authenticationFailed();
    }
  }

  private getAccessTokenSecret(): string {
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not configured');
    }

    return secret;
  }

  private authenticationFailed(): UnauthorizedException {
    return new UnauthorizedException({
      success: false,
      code: ERROR_CODES.AUTHENTICATION_FAILED,
      message: 'Authentication failed',
    });
  }
}
