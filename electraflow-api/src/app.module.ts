import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { LeadsModule } from './leads/leads.module';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { ProposalsModule } from './proposals/proposals.module';
import { WorksModule } from './works/works.module';
import { ProcessesModule } from './processes/processes.module';
import { TasksModule } from './tasks/tasks.module';
import { ProtocolsModule } from './protocols/protocols.module';
import { DocumentsModule } from './documents/documents.module';
import { PackagesModule } from './packages/packages.module';
import { RulesModule } from './rules/rules.module';
import { FinanceModule } from './finance/finance.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CatalogModule } from './catalog/catalog.module';
import { EmployeesModule } from './employees/employees.module';
import { EmailModule } from './email/email.module';
import { SupplyModule } from './supply/supply.module';
import { ComplianceModule } from './compliance/compliance.module';
import { FiscalModule } from './fiscal/fiscal.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DailyLogsModule } from './daily-logs/daily-logs.module';
import { InventoryModule } from './inventory/inventory.module';
import { ServiceOrdersModule } from './service-orders/service-orders.module';
import { ContractsModule } from './contracts/contracts.module';
import { SolarModule } from './solar/solar.module';
import { CompaniesModule } from './companies/companies.module';
import { StructureTemplatesModule } from './structure-templates/structure-templates.module';
import { MarkupModule } from './markup/markup.module';
import { AiModule } from './ai/ai.module';
import { OemModule } from './oem/oem.module';
import { SinapiModule } from './sinapi/sinapi.module';
import { BudgetsModule } from './budgets/budgets.module';
import { SolarReportsModule } from './solar-reports/solar-reports.module';
import { SignaturesModule } from './signatures/signatures.module';
import { SimulationsModule } from './simulations/simulations.module';
import { PortalModule } from './portal/portal.module';
import { EquipmentModule } from './equipment/equipment.module';
import { ReferralsModule } from './referrals/referrals.module';
import { PartnerRequestsModule } from './partner-requests/partner-requests.module';
import { LaudosModule } from './laudos/laudos.module';
import { CategoriesModule } from './categories/categories.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        // === Obrigatórias ===
        DATABASE_URL: Joi.string().uri().required()
          .description('URL de conexão PostgreSQL/Supabase'),
        JWT_SECRET: Joi.string().min(10).required()
          .description('Chave secreta para tokens JWT (mín. 10 caracteres)'),

        // === Opcionais com defaults ===
        PORT: Joi.number().default(3001),
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        FRONTEND_URL: Joi.string().default('http://localhost:5173'),
        JWT_EXPIRATION: Joi.string().default('24h'),

        // === Upload ===
        UPLOAD_DEST: Joi.string().default('./uploads'),
        MAX_FILE_SIZE: Joi.number().default(10485760),

        // === Email (opcionais) ===
        SMTP_HOST: Joi.string().allow('').optional(),
        SMTP_PORT: Joi.number().default(587),
        SMTP_USER: Joi.string().allow('').optional(),
        SMTP_PASS: Joi.string().allow('').optional(),

        // === Integrações (opcionais) ===
        WHATSAPP_API_URL: Joi.string().allow('').optional(),
        WHATSAPP_API_KEY: Joi.string().allow('').optional(),
        NEOENERGIA_API_URL: Joi.string().allow('').optional(),
        NEOENERGIA_API_KEY: Joi.string().allow('').optional(),

        // === Supabase Storage (opcionais) ===
        SUPABASE_URL: Joi.string().allow('').optional(),
        SUPABASE_SERVICE_KEY: Joi.string().allow('').optional(),

        // === Sentry (opcional) ===
        SENTRY_DSN: Joi.string().allow('').optional(),
      }),
      validationOptions: {
        abortEarly: false,    // Mostrar TODOS os erros, não apenas o primeiro
        allowUnknown: true,   // Permitir env vars extras (Railway injeta várias)
      },
    }),
    ThrottlerModule.forRoot([{
      name: 'default',
      ttl: 10000,    // janela de 10 segundos
      limit: 100,   // 100 requests por 10s por IP (600/min) — suficiente para ERP interno
    }, {
      name: 'auth',
      ttl: 60000,   // 1 minuto
      limit: 10,    // 10 tentativas de login por minuto (segurança)
    }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: true, // Auto-run pending migrations on startup
        synchronize: false, // Banco antigo já possui schema completo
        logging: configService.get('NODE_ENV') === 'development' ? ['error', 'warn', 'schema'] : false,
        ssl: { rejectUnauthorized: false },
        retryAttempts: 5,
        retryDelay: 3000,
        extra: {
          family: 4, // Forçar IPv4 — Railway não alcança Supabase via IPv6
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    ClientsModule,
    LeadsModule,
    OpportunitiesModule,
    ProposalsModule,
    WorksModule,
    ProcessesModule,
    TasksModule,
    ProtocolsModule,
    DocumentsModule,
    PackagesModule,
    RulesModule,
    FinanceModule,
    DashboardModule,
    CatalogModule,
    EmployeesModule,
    EmailModule,
    SupplyModule,
    ComplianceModule,
    FiscalModule,
    NotificationsModule,
    DailyLogsModule,
    InventoryModule,
    ServiceOrdersModule,
    ContractsModule,
    SolarModule,
    CompaniesModule,
    StructureTemplatesModule,
    MarkupModule,
    AiModule,
    OemModule,
    SinapiModule,
    BudgetsModule,
    SolarReportsModule,
    SignaturesModule,
    SimulationsModule,
    PortalModule,
    EquipmentModule,
    ReferralsModule,
    PartnerRequestsModule,
    LaudosModule,
    CategoriesModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
