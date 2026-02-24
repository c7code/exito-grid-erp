import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { WorksModule } from './works/works.module';
import { TasksModule } from './tasks/tasks.module';
import { DocumentsModule } from './documents/documents.module';
import { WorkflowConfigModule } from './workflow-config/workflow-config.module';
import { DeadlineApprovalsModule } from './deadline-approvals/deadline-approvals.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProtocolsModule } from './protocols/protocols.module';

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
        url: configService.get<string>('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        ssl: { rejectUnauthorized: false },
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    ClientsModule,
    WorksModule,
    TasksModule,
    DocumentsModule,
    WorkflowConfigModule,
    DeadlineApprovalsModule,
    DashboardModule,
    ProtocolsModule,
  ],
})
export class AppModule { }
