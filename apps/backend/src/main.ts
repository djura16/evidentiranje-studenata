import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS - prvo omogući CORS
  app.enableCors({
    origin: true, // Dozvoli sve origin-e u development-u
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  // Global prefix - postavljen PRE Swagger-a da bi Swagger video prave rute
  app.setGlobalPrefix('api');

  // Swagger - postavljen posle global prefix-a, dostupan na /api/docs
  const config = new DocumentBuilder()
    .setTitle('Evidentiranje Studenata API')
    .setDescription('API za evidenciju prisustva studenata pomoću QR kodova')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = parseInt(process.env.PORT || '5001', 10);
  await app.listen(port, '0.0.0.0'); // Slušaj na svim interfejsima
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
  console.log(`API endpoints: http://localhost:${port}/api`);
}
bootstrap();
