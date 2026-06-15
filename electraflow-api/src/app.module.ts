import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
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
        synchronize: true, // TEMPORÁRIO: criando schema inicial no banco novo
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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
