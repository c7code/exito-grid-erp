import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve uploaded files statically
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman, etc.)
      if (!origin) return callback(null, true);
      // Allow any Railway subdomain
      if (origin.endsWith('.up.railway.app')) return callback(null, true);
      // Allow localhost dev
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
      ];
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    exposedHeaders: ['Content-Disposition'],
    credentials: true,
    maxAge: 86400, // Cache preflight for 24h
  });

  app.setGlobalPrefix('api', {
    exclude: ['api/docs', 'api/docs-json'],
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
  }));

  const config = new DocumentBuilder()
    .setTitle('ElectraFlow API')
    .setDescription('ERP/CRM para Engenharia Elétrica')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 ElectraFlow API rodando na porta ${port}`);
  console.log(`📚 Documentação: http://localhost:${port}/api/docs`);
}
bootstrap();
