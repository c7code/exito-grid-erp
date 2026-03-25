import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Catch, ArgumentsHost, HttpException, HttpStatus, ExceptionFilter } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';
import * as bodyParser from 'body-parser';

@Catch()
class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extract message properly from HttpException objects
    let message = 'Internal server error';
    let detail = null;
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = (res as any).message || exception.message;
        detail = (res as any).detail || null;
      }
    } else {
      message = exception?.message || 'Internal server error';
      detail = exception?.detail || exception?.driverError?.detail || null;
    }

    console.error('GLOBAL EXCEPTION:', status, message, detail, exception?.stack);
    try {
      if (response && !response.headersSent) {
        response.status(status).json({
          statusCode: status,
          message,
          detail,
        });
      }
    } catch (e) {
      console.error('Exception filter error:', e);
    }
  }
}

async function bootstrap() {
  // Disable NestJS's built-in body parser (100KB limit) so we can use our own
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  // ═══ CORS — must be FIRST, before any other middleware ═══
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
    maxAge: 86400,
  });

  // Use custom body parsers with generous limits (proposals can be large)
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Express-level error handler — catches body parser errors BEFORE NestJS
  app.use((err: any, req: any, res: any, next: any) => {
    if (err) {
      console.error('EXPRESS ERROR:', err.type, err.message);
      const status = err.status || err.statusCode || 500;
      if (!res.headersSent) {
        res.status(status).json({
          statusCode: status,
          message: err.message || 'Express error',
          detail: err.type || null,
        });
      }
      return;
    }
    next();
  });

  // Version/health endpoint (no auth required)
  const DEPLOY_TS = new Date().toISOString();
  app.use('/api/health', (req: any, res: any) => {
    res.json({ status: 'ok', deployedAt: DEPLOY_TS, version: '2026-03-25-cors-fix' });
  });

  // Global exception filter — catches ALL errors and returns JSON
  app.useGlobalFilters(new AllExceptionsFilter());

  // Serve uploaded files statically
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });

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
