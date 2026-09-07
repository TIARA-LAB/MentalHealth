import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mental Health API')
    .setDescription(
      'REST API for the Mental Health platform.\n\n' +
        '## Authentication\n\n' +
        '- `POST /auth/register` and `POST /auth/login` return an `accessToken` (JWT) and a `refreshToken`.\n' +
        '- Protect routes use an `accessToken` sent as `Authorization: Bearer <accessToken>` (select "access-token" in Swagger).\n' +
        '- `POST /auth/refresh` rotates a valid, non-revoked `refreshToken` — send it in the **request body**.\n' +
        '  Do not send the `accessToken` in the Authorization header on the refresh call.\n' +
        '- `POST /auth/logout`, password changes, and account deletion revoke the user refresh tokens.\n\n' +
        '## Working with the API\n\n' +
        'Modules: **Auth**, **Users**, **Profile** (with streak tracking), **Check-ins** ' +
        '(one per day, drives the streak), and **Journal** entries.\n\n' +
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

  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
