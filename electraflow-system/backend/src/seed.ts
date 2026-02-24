import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from './app.module';
import { User, UserRole, UserStatus } from './users/user.entity';
import { Client, ClientType, ClientSegment } from './clients/client.entity';
import { WorkflowConfig, WorkType, ProcessStage } from './workflow-config/workflow-config.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepo = app.get(getRepositoryToken(User));
  const clientRepo = app.get(getRepositoryToken(Client));
  const workflowRepo = app.get(getRepositoryToken(WorkflowConfig));

  console.log('🌱 Seeding database...');

  // Create admin user
  const adminExists = await userRepo.findOne({ where: { email: 'admin@electraflow.com' } });
  if (!adminExists) {
    const adminPassword = await bcrypt.hash('admin123', 10);
    await userRepo.save({
      name: 'Administrador',
      email: 'admin@electraflow.com',
      password: adminPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      department: 'Administração',
      position: 'Gerente Geral',
    });
    console.log('✅ Admin user created');
  }

  // Create employee users
  const employees = [
    { name: 'João Silva', email: 'joao@electraflow.com', department: 'Projetos', position: 'Engenheiro' },
    { name: 'Maria Santos', email: 'maria@electraflow.com', department: 'Comercial', position: 'Vendedora' },
    { name: 'Pedro Lima', email: 'pedro@electraflow.com', department: 'Operações', position: 'Técnico' },
  ];

  for (const emp of employees) {
    const exists = await userRepo.findOne({ where: { email: emp.email } });
    if (!exists) {
      const password = await bcrypt.hash('employee123', 10);
      await userRepo.save({
        ...emp,
        password,
        role: UserRole.EMPLOYEE,
        status: UserStatus.ACTIVE,
      });
      console.log(`✅ Employee ${emp.name} created`);
    }
  }

  // Create client users
  const clients = [
    { name: 'SolarTech Indústria', email: 'contato@solartech.com', segment: ClientSegment.INDUSTRIAL },
    { name: 'Condomínio Vista Mar', email: 'sindico@vistamar.com', segment: ClientSegment.CONDOMINIUM },
    { name: 'Hospital São Lucas', email: 'engenharia@saolucas.com', segment: ClientSegment.COMMERCIAL },
  ];

  for (const cli of clients) {
    const exists = await clientRepo.findOne({ where: { email: cli.email } });
    if (!exists) {
      const password = await bcrypt.hash('client123', 10);
      await clientRepo.save({
        ...cli,
        password,
        type: ClientType.COMPANY,
        hasPortalAccess: true,
        isActive: true,
      });
      console.log(`✅ Client ${cli.name} created`);
    }
  }

  // Create workflow configurations
  const workflowConfigs = [
    // PDE - Projeto
    { workType: WorkType.PDE, stage: ProcessStage.PROJECT, stepName: 'Levantamento técnico', defaultDeadlineDays: 3, order: 1 },
    { workType: WorkType.PDE, stage: ProcessStage.PROJECT, stepName: 'Elaboração do projeto', defaultDeadlineDays: 7, order: 2 },
    { workType: WorkType.PDE, stage: ProcessStage.PROJECT, stepName: 'Revisão interna', defaultDeadlineDays: 2, order: 3 },
    // PDE - Aprovação
    { workType: WorkType.PDE, stage: ProcessStage.APPROVAL, stepName: 'Aprovação do cliente', defaultDeadlineDays: 5, order: 1, requiresClientApproval: true },
    { workType: WorkType.PDE, stage: ProcessStage.APPROVAL, stepName: 'Ajustes finais', defaultDeadlineDays: 3, order: 2 },
    // PDE - Protocolo
    { workType: WorkType.PDE, stage: ProcessStage.PROTOCOL, stepName: 'Envio à concessionária', defaultDeadlineDays: 2, order: 1 },
    { workType: WorkType.PDE, stage: ProcessStage.PROTOCOL, stepName: 'Análise do protocolo', defaultDeadlineDays: 15, order: 2 },
    { workType: WorkType.PDE, stage: ProcessStage.PROTOCOL, stepName: 'Vistoria técnica', defaultDeadlineDays: 10, order: 3 },
    // Solar - Projeto
    { workType: WorkType.SOLAR, stage: ProcessStage.PROJECT, stepName: 'Análise de viabilidade', defaultDeadlineDays: 2, order: 1 },
    { workType: WorkType.SOLAR, stage: ProcessStage.PROJECT, stepName: 'Projeto executivo', defaultDeadlineDays: 5, order: 2 },
    // Solar - Aprovação
    { workType: WorkType.SOLAR, stage: ProcessStage.APPROVAL, stepName: 'Aprovação do cliente', defaultDeadlineDays: 3, order: 1, requiresClientApproval: true },
    // Solar - Execução
    { workType: WorkType.SOLAR, stage: ProcessStage.EXECUTION, stepName: 'Aquisição de materiais', defaultDeadlineDays: 7, order: 1 },
    { workType: WorkType.SOLAR, stage: ProcessStage.EXECUTION, stepName: 'Instalação', defaultDeadlineDays: 10, order: 2 },
    { workType: WorkType.SOLAR, stage: ProcessStage.EXECUTION, stepName: 'Comissionamento', defaultDeadlineDays: 3, order: 3 },
  ];

  for (const config of workflowConfigs) {
    const exists = await workflowRepo.findOne({
      where: {
        workType: config.workType,
        stage: config.stage,
        stepName: config.stepName,
      },
    });
    if (!exists) {
      await workflowRepo.save({
        ...config,
        name: `${config.workType} - ${config.stage} - ${config.stepName}`,
        requiresApproval: true,
        isActive: true,
        createdBy: { id: adminExists?.id || 'admin' } as any,
      });
      console.log(`✅ Workflow config ${config.stepName} created`);
    }
  }

  console.log('✅ Database seeded successfully!');
  await app.close();
}

bootstrap().catch(console.error);
