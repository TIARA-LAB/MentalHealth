import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import { AppModule } from './app.module';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.enableShutdownHooks();

  const adapter = app.getHttpAdapter();
  if (adapter.getType() === 'express') {
    (adapter.getInstance() as express.Express).disable('x-powered-by');
  }

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    );
    next();
  });

  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : false,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerEnabled = process.env.SWAGGER_ENABLED === 'true';
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Mental Health API')
      .setDescription(
        'REST API for the Mental Health platform.\n\n' +
          '## Authentication\n\n' +
          '- `POST /auth/register` and `POST /auth/login` return an `accessToken` (JWT) and a `refreshToken`.\n' +
          '- Protect routes use an `accessToken` sent as `Authorization: Bearer <accessToken>` (select "access-token" in Swagger).\n' +
          '- `POST /auth/refresh` and `POST /auth/refresh-token` rotate a valid, non-revoked `refreshToken` — send it in the **request body**.\n' +
          '  Do not send the `accessToken` in the Authorization header on the refresh call.\n' +
          '- `POST /auth/logout`, password changes, and account deletion revoke the user refresh tokens.\n' +
          '- Email and phone verification codes are returned in the response in non-production environments.\n\n' +
          '## Working with the API\n\n' +
          'Modules: **Auth**, **Users** (profile, avatar, wellness goals, data export), **Profile** (with streak tracking), ' +
          '**Mood check-ins** (`/mood-checkins`, one per day, drives the streak), **Journal entries** (`/journal-entries`, also served at `/journal`), ' +
          '**Onboarding**, **Moods**, **Dashboard**, **Reports**, **Wellness** (tips and recommendations), ' +
          '**Prompts**, **Notifications** (settings, devices, reminders), **Settings**, **Legal**, **System**, and **Support**.\n\n' +
          'Global rate limit: **10 requests / 60s** per IP. Unknown request fields are ' +
          'rejected with `400`.',
      )
      .setVersion('0.0.1')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  app.useGlobalFilters(new PrismaClientExceptionFilter());

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
