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
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
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
  ],
})
export class AppModule { }
