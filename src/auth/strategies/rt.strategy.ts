import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export type RefreshTokenPayload = {
  sub: string;
  email: string;
  rt: string;
};

const extractJwtFromBody = (req: {
  body?: { refreshToken?: string };
}): string | null => {
  return req?.body?.refreshToken ?? null;
};

export type RequestWithBody = {
  headers?: { authorization?: string };
  body?: { refreshToken?: string };
};

const extractRefreshToken = (req: RequestWithBody): string | null => {
  const headerToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  if (headerToken) {
    return headerToken;
  }
  return extractJwtFromBody(req);
};

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: extractRefreshToken,
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      ignoreExpiration: false,
    });
  }

  validate(payload: RefreshTokenPayload) {
    return { id: payload.sub, email: payload.email, refreshToken: payload.rt };
  }
}
