import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserRole } from '../../generated/prisma/client.js';
import { ERROR_CODES } from '../../common/constants/error-codes.constants.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { AuthenticatedUser } from '../types/auth.types.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user: AuthenticatedUser;
    }>();

    if (!requiredRoles.includes(request.user.role)) {
      throw new ForbiddenException({
        success: false,
        code: ERROR_CODES.AUTHENTICATION_FAILED,
        message: 'You do not have permission to access this resource',
      });
    }

    return true;
  }
}
