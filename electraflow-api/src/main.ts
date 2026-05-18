// ─── Sentry (inline — must be before any other import) ───────────────────────
import * as Sentry from '@sentry/nestjs';
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: 0.1,
    beforeSend(event) {
      const data = event.request?.data as any;
      if (data?.password) data.password = '[REDACTED]';
      if (data?.refresh_token) data.refresh_token = '[REDACTED]';
      return event;
    },
  });
}
// ─────────────────────────────────────────────────────────────────────────────
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Catch, ArgumentsHost, HttpException, HttpStatus, ExceptionFilter } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';
import * as fs from 'fs';
import * as bodyParser from 'body-parser';
import helmet from 'helmet';

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

  // ═══ HELMET — Security HTTP headers ═══
  app.use(helmet({
    crossOriginEmbedderPolicy: false, // allow PDF/iframe
    contentSecurityPolicy: false,     // allow inline styles used by React
  }));

  // ═══ CORS — must be after helmet ═══
  const allowedOrigins = [
    // Local dev
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    // Production custom domain
    'https://erp.producao.grupoexito.app.br',
    // Any env-var configured frontend
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      // Allow any Railway subdomain (*.up.railway.app)
      if (origin.includes('.up.railway.app')) return callback(null, true);
      // Allow explicit list
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Blocked — log it so we can diagnose
      console.warn(`⚠️  CORS BLOCKED origin: "${origin}"`);
      return callback(new Error(`CORS: origin not allowed: ${origin}`), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'X-Api-Key'],
    exposedHeaders: ['Content-Disposition'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
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
    whitelist: false,            // disabled: most controllers use plain objects, not decorated DTOs
    forbidNonWhitelisted: false,
    transformOptions: { enableImplicitConversion: true },
  }));

  const config = new DocumentBuilder()
    .setTitle('ElectraFlow API')
    .setDescription('ERP/CRM para Engenharia Elétrica')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // ═══ SPA FALLBACK — serve React frontend para rotas que não são /api ═══
  // Isso permite que a API e o frontend coexistam no mesmo serviço Railway
  const frontendDist = join(__dirname, '..', 'public', 'frontend');
  if (fs.existsSync(frontendDist)) {
    app.useStaticAssets(frontendDist, { index: false });
    // Catch-all: APENAS GET de rotas não-API retorna o index.html do React
    // POST/PUT/PATCH/DELETE sempre passam para o NestJS
    app.use((req: any, res: any, next: any) => {
      if (req.method !== 'GET') return next();
      if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) return next();
      const indexPath = join(frontendDist, 'index.html');
      if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
      next();
    });
    console.log(`🖥️  Frontend React servido em: ${frontendDist}`);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 ElectraFlow API rodando na porta ${port}`);
  console.log(`📚 Documentação: http://localhost:${port}/api/docs`);
  console.log(`🔒 Helmet: ON | ValidationPipe: whitelist=true`);
}
bootstrap();
