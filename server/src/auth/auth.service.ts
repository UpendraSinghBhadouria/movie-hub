import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { User, UserRole } from '../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';

import {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
} from '../common/constants/app.constants.js';

import { ERROR_CODES } from '../common/constants/error-codes.constants.js';

import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

import {
  TokenPayload,
  AuthResponse,
  AuthenticatedUser,
  RefreshAuthResponse,
} from '../common/types/auth.types.js';

@Injectable()
export class AuthService {
  private readonly bcryptRounds = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      throw new ConflictException({
        success: false,
        code: ERROR_CODES.AUTHENTICATION_FAILED,
        message: 'An account with this email already exists',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, this.bcryptRounds);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        passwordHash,
        mobile: dto.mobile?.trim() || null,
        role: UserRole.USER,
      },
    });

    return this.createAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw this.invalidCredentials();
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      throw this.invalidCredentials();
    }

    return this.createAuthResponse(user);
  }

  async createAndStoreRefreshToken(userId: string): Promise<string> {
    const user = await this.prisma.user.findFirst({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found for this id');

    const refreshToken = await this.createRefreshToken(user);
    const tokenHash = await this.hashRefreshToken(refreshToken);

    const expiresAt = await this.getRefreshTokenExpiry(refreshToken);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        expiresAt,
        userId,
      },
    });

    return refreshToken;
  }

  // async refresh(refreshToken: string): Promise<RefreshAuthResponse> {
  //   try {
  //     const payload = await this.jwtService.verifyAsync<TokenPayload>(
  //       refreshToken,
  //       {
  //         secret: this.getRefreshTokenSecret(),
  //         ignoreExpiration: true,
  //       },
  //     );

  //     const storedTokens = await this.prisma.refreshToken.findMany({
  //       where: {
  //         userId: payload.sub,
  //         revokedAt: null,
  //       },
  //       include: {
  //         user: true,
  //       },
  //     });

  //     let storedToken: (typeof storedTokens)[number] | undefined;

  //     for (const token of storedTokens) {
  //       const isMatch = await bcrypt.compare(refreshToken, token.tokenHash);

  //       if (isMatch) {
  //         storedToken = token;
  //         break;
  //       }
  //     }

  //     if (!storedToken) {
  //       throw this.invalidRefreshToken();
  //     }

  //     if (storedToken.expiresAt <= new Date()) {
  //       await this.prisma.refreshToken.update({
  //         where: {
  //           id: storedToken.id,
  //         },
  //         data: {
  //           revokedAt: new Date(),
  //         },
  //       });

  //       throw this.invalidRefreshToken();
  //     }

  //     const newRefreshToken = await this.createRefreshToken(storedToken.user);

  //     const newRefreshTokenHash = await this.hashRefreshToken(newRefreshToken);

  //     const expiresAt = await this.getRefreshTokenExpiry(newRefreshToken);

  //     const accessToken = await this.createAccessToken(storedToken.user);

  //     await this.prisma.$transaction([
  //       this.prisma.refreshToken.update({
  //         where: {
  //           id: storedToken.id,
  //         },
  //         data: {
  //           revokedAt: new Date(),
  //         },
  //       }),

  //       this.prisma.refreshToken.create({
  //         data: {
  //           tokenHash: newRefreshTokenHash,
  //           expiresAt,
  //           userId: storedToken.userId,
  //         },
  //       }),
  //     ]);

  //     return {
  //       accessToken,
  //       refreshToken: newRefreshToken,
  //       user: this.toAuthenticatedUser(storedToken.user),
  //     };
  //   } catch (error) {
  //     if (error instanceof UnauthorizedException) {
  //       throw error;
  //     }

  //     throw this.invalidRefreshToken();
  //   }
  // }

  async refresh(refreshToken: string): Promise<RefreshAuthResponse> {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(
        refreshToken,
        {
          secret: this.getRefreshTokenSecret(),
        },
      );

      const storedTokens = await this.prisma.refreshToken.findMany({
        where: {
          userId: payload.sub,
          revokedAt: null,
        },
        include: {
          user: true,
        },
      });

      let storedToken: (typeof storedTokens)[number] | undefined;

      for (const token of storedTokens) {
        const isMatch = await bcrypt.compare(refreshToken, token.tokenHash);

        if (isMatch) {
          storedToken = token;
          break;
        }
      }

      if (!storedToken) {
        throw this.invalidRefreshToken();
      }

      if (storedToken.expiresAt <= new Date()) {
        await this.prisma.refreshToken.update({
          where: {
            id: storedToken.id,
          },
          data: {
            revokedAt: new Date(),
          },
        });

        throw this.invalidRefreshToken();
      }

      const newRefreshToken = await this.createRefreshToken(storedToken.user);

      const newRefreshTokenHash = await this.hashRefreshToken(newRefreshToken);

      const expiresAt = await this.getRefreshTokenExpiry(newRefreshToken);

      const accessToken = await this.createAccessToken(storedToken.user);

      await this.prisma.$transaction([
        this.prisma.refreshToken.update({
          where: {
            id: storedToken.id,
          },
          data: {
            revokedAt: new Date(),
          },
        }),

        this.prisma.refreshToken.create({
          data: {
            tokenHash: newRefreshTokenHash,
            expiresAt,
            userId: storedToken.userId,
          },
        }),
      ]);

      return {
        accessToken,
        refreshToken: newRefreshToken,
        user: this.toAuthenticatedUser(storedToken.user),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw this.invalidRefreshToken();
    }
  }
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = await this.hashRefreshToken(refreshToken);

    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async getCurrentUser(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        success: false,
        code: ERROR_CODES.USER_NOT_FOUND,
        message: 'User not found',
      });
    }

    return this.toAuthenticatedUser(user);
  }

  private async createAuthResponse(user: User): Promise<AuthResponse> {
    const accessToken = await this.createAccessToken(user);

    return {
      accessToken,
      user: this.toAuthenticatedUser(user),
    };
  }

  private async createAccessToken(user: User): Promise<string> {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.getAccessTokenSecret(),
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });
  }

  private async createRefreshToken(user: User): Promise<string> {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.getRefreshTokenSecret(),
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });
  }

  private async hashRefreshToken(token: string): Promise<string> {
    return await bcrypt.hash(token, this.bcryptRounds);
  }

  private async getRefreshTokenExpiry(token: string): Promise<Date> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.getRefreshTokenSecret(),
        ignoreExpiration: true, // Allows reading the exp of an already expired token
      });

      return new Date(payload.exp * 1000);
    } catch (error) {
      throw new UnauthorizedException('Invalid token signature');
    }
  }

  //   private getRefreshTokenExpiry(): Date {
  //     const expiresAt = new Date();

  //     expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS);

  //     return expiresAt;
  //   }

  private getAccessTokenSecret(): string {
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');

    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not configured');
    }

    return secret;
  }

  private getRefreshTokenSecret(): string {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }

    return secret;
  }

  private toAuthenticatedUser(user: User): AuthenticatedUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
    };
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException({
      success: false,
      code: ERROR_CODES.INVALID_CREDENTIALS,
      message: 'Invalid email or password',
    });
  }

  private invalidRefreshToken(): UnauthorizedException {
    return new UnauthorizedException({
      success: false,
      code: ERROR_CODES.REFRESH_TOKEN_INVALID,
      message: 'Invalid or expired refresh token',
    });
  }
}
