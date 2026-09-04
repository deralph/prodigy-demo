import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

// Prisma / PostgreSQL can return BigInt for count/sequence values;
// JSON.stringify has no built-in support for BigInt — coerce to Number.
(BigInt.prototype as any).toJSON = function () { return Number(this); };

async function bootstrap() {
  // rawBody: true is required so the Paystack webhook can verify its HMAC
  // signature against the ORIGINAL request bytes (re-serializing parsed JSON
  // would produce a different digest and defeat signature verification).
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, etc.)
  // — standard hardening for any production API, doubly important for a
  // financial service handling money movement and PII.
  app.use(helmet());

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger docs — only in non-production environments. Publicly exposing
  // the full API schema (every admin route, every DTO field name) in
  // production is unnecessary attack-surface for a financial application.
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Prodigy Finance API')
      .setDescription('Backend API for the Prodigy Finance platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Prodigy API running on http://localhost:${process.env.PORT ?? 3000}/api/v1`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📖 Swagger docs at http://localhost:${process.env.PORT ?? 3000}/api/docs`);
  }
}

bootstrap();
