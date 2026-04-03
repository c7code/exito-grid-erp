import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Schema gerenciado manualmente
        logging: configService.get('NODE_ENV') === 'development' ? ['error', 'warn', 'schema'] : false,
        ssl: { rejectUnauthorized: false },
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
  ],
})
export class AppModule { }
