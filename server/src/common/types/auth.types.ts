import type { Request } from 'express';
import { UserRole } from '../../generated/prisma/client.js';

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthenticatedUser;
}

export interface RefreshAuthResponse extends AuthResponse {
  refreshToken: string;
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email?: string;
    role?: string;
  };
}
