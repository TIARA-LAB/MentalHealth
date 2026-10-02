import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { hash, verify } from '@node-rs/argon2';
import { randomInt, randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationType } from '../generated/prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    if (dto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already registered');
      }
    }

    const hashedPassword = await hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: dto.name,
        phone: dto.phone,
        profile: { create: {} },
      },
    });

    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Provide an email or phone number');
    }

    const loginEmail = dto.email ? dto.email.toLowerCase() : undefined;
    const user = await this.prisma.user.findUnique({
      where: loginEmail ? { email: loginEmail } : { phone: dto.phone },
    });
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await verify(user.password, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
      ...tokens,
    };
  }

  async refresh(userId: string, email: string, rt: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Access denied');
    }

    const storedTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedTokens.length) {
      throw new ForbiddenException('Access denied');
    }

    let match: (typeof storedTokens)[number] | undefined;
    for (const token of storedTokens) {
      const rtMatches = await verify(token.token, rt);
      if (rtMatches) {
        match = token;
        break;
      }
    }

    if (!match) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.refreshToken.update({
      where: { id: match.id },
      data: { revoked: true },
    });

    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
    return { message: 'Logged out successfully' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid verification code');
    }

    await this.consumeVerificationToken(
      user.id,
      VerificationType.EMAIL,
      dto.code,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });

    return { message: 'Email verified successfully', emailVerified: true };
  }

  async verifyPhone(dto: VerifyPhoneDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid verification code');
    }

    await this.consumeVerificationToken(
      user.id,
      VerificationType.PHONE,
      dto.code,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { phoneVerifiedAt: new Date() },
    });

    return { message: 'Phone verified successfully', phoneVerified: true };
  }

  async resendVerification(dto: ResendVerificationDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Provide an email or phone number');
    }

    const email = dto.email ? dto.email.toLowerCase() : undefined;
    const user = email
      ? await this.prisma.user.findUnique({ where: { email } })
      : await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    const type = email ? VerificationType.EMAIL : VerificationType.PHONE;
    const code = this.generateOtp();
    await this.issueVerificationToken(user.id, type, code);

    if (this.isDev()) {
      return { message: 'Verification code sent', code };
    }
    return { message: 'Verification code sent' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (user && !user.deletedAt) {
      const token = randomUUID();
      await this.issueVerificationToken(
        user.id,
        VerificationType.PASSWORD_RESET,
        token,
        30,
      );

      if (this.isDev()) {
        return { message: 'Password reset token generated', token };
      }
    }

    return { message: 'If that email exists, a reset link was sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokens = await this.prisma.verificationToken.findMany({
      where: {
        type: VerificationType.PASSWORD_RESET,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    let matched: (typeof tokens)[number] | undefined;
    for (const token of tokens) {
      if (await verify(token.tokenHash, dto.token)) {
        matched = token;
        break;
      }
    }
    if (!matched) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const hashedPassword = await hash(dto.newPassword);
    await this.prisma.$transaction([
      this.prisma.verificationToken.update({
        where: { id: matched.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: matched.userId, revoked: false },
        data: { revoked: true },
      }),
      this.prisma.user.update({
        where: { id: matched.userId },
        data: { password: hashedPassword },
      }),
    ]);

    return { message: 'Password reset successfully' };
  }

  async getSessions(userId: string) {
    return this.prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        revoked: true,
      },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const result = await this.prisma.refreshToken.updateMany({
      where: { id: sessionId, userId, revoked: false },
      data: { revoked: true },
    });
    if (result.count === 0) {
      throw new NotFoundException('Session not found');
    }
    return { message: 'Session revoked successfully' };
  }

  async revokeAllOtherSessions(userId: string, keepSessionId?: string) {
    const where = {
      userId,
      revoked: false,
      ...(keepSessionId ? { NOT: { id: keepSessionId } } : {}),
    };
    const result = await this.prisma.refreshToken.updateMany({
      where,
      data: { revoked: true },
    });
    return {
      message: keepSessionId
        ? 'Other sessions revoked'
        : 'All sessions revoked',
      revokedCount: result.count,
    };
  }

  private async consumeVerificationToken(
    userId: string,
    type: VerificationType,
    raw: string,
  ) {
    const tokens = await this.prisma.verificationToken.findMany({
      where: {
        userId,
        type,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    let matched: (typeof tokens)[number] | undefined;
    for (const token of tokens) {
      if (await verify(token.tokenHash, raw)) {
        matched = token;
        break;
      }
    }
    if (!matched) {
      throw new UnauthorizedException('Invalid verification code');
    }

    await this.prisma.verificationToken.update({
      where: { id: matched.id },
      data: { usedAt: new Date() },
    });
  }

  private async issueVerificationToken(
    userId: string,
    type: VerificationType,
    raw: string,
    ttlMinutes = 10,
  ) {
    const tokenHash = await hash(raw);
    await this.prisma.verificationToken.create({
      data: {
        userId,
        type,
        tokenHash,
        expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
      },
    });
  }

  private generateOtp(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private isDev(): boolean {
    return this.config.get<string>('NODE_ENV') !== 'production';
  }

  private async generateTokens(userId: string, email: string) {
    const [at, rt] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, email, jti: randomUUID() },
        {
          secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
          expiresIn: this.config.getOrThrow<string>(
            'JWT_ACCESS_EXPIRATION',
          ) as never,
        },
      ),
      this.jwt.signAsync(
        { sub: userId, email, jti: randomUUID() },
        {
          secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.config.getOrThrow<string>(
            'JWT_REFRESH_EXPIRATION',
          ) as never,
        },
      ),
    ]);

    return { accessToken: at, refreshToken: rt };
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    const expiresIn = this.config.getOrThrow<string>('JWT_REFRESH_EXPIRATION');
    const expiresAt = new Date();

    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2];
      if (unit === 's') expiresAt.setSeconds(expiresAt.getSeconds() + value);
      else if (unit === 'm')
        expiresAt.setMinutes(expiresAt.getMinutes() + value);
      else if (unit === 'h') expiresAt.setHours(expiresAt.getHours() + value);
      else if (unit === 'd') expiresAt.setDate(expiresAt.getDate() + value);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    const hashed = await hash(refreshToken);
    await this.prisma.refreshToken.create({
      data: {
        token: hashed,
        userId,
        expiresAt,
      },
    });
  }
}
