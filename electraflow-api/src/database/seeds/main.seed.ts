import { DataSource } from 'typeorm';
import { User, UserRole } from '../../users/user.entity';
import { Client, ClientSegment, ClientClassification } from '../../clients/client.entity';
import { Lead, LeadSource, LeadStatus } from '../../leads/lead.entity';
import { Opportunity, OpportunityStage } from '../../opportunities/opportunity.entity';
import { Work, WorkStatus, WorkType } from '../../works/work.entity';
import { Process, ProcessStatus } from '../../processes/process.entity';
import { Task, TaskStatus, TaskPriority } from '../../tasks/task.entity';
import { Proposal, ProposalStatus } from '../../proposals/proposal.entity';
import { Protocol, ProtocolStatus } from '../../protocols/protocol.entity';
import { Rule, RuleAction, RuleCondition } from '../../rules/rule.entity';
import { Package } from '../../packages/package.entity';

export async function seedDatabase(dataSource: DataSource): Promise<void> {
  console.log('🌱 Starting database seed...');

  const userRepository = dataSource.getRepository(User);
  const clientRepository = dataSource.getRepository(Client);
  const leadRepository = dataSource.getRepository(Lead);
  const opportunityRepository = dataSource.getRepository(Opportunity);
  const workRepository = dataSource.getRepository(Work);
  const processRepository = dataSource.getRepository(Process);
  const taskRepository = dataSource.getRepository(Task);
  const proposalRepository = dataSource.getRepository(Proposal);
  const protocolRepository = dataSource.getRepository(Protocol);
  const ruleRepository = dataSource.getRepository(Rule);
  const packageRepository = dataSource.getRepository(Package);

  // Create admin user
  const adminUser = userRepository.create({
    email: 'admin@electraflow.com.br',
    password: '$2b$10$YourHashedPasswordHere', // admin123
    name: 'Administrador Sistema',
    role: UserRole.ADMIN,
    isActive: true,
  });
  await userRepository.save(adminUser);
  console.log('✅ Admin user created');

  // Create commercial user
  const commercialUser = userRepository.create({
    email: 'comercial@electraflow.com.br',
    password: '$2b$10$YourHashedPasswordHere',
    name: 'João Silva',
    role: UserRole.COMMERCIAL,
    isActive: true,
  });
  await userRepository.save(commercialUser);
  console.log('✅ Commercial user created');

  // Create technical user
  const technicalUser = userRepository.create({
    email: 'tecnico@electraflow.com.br',
    password: '$2b$10$YourHashedPasswordHere',
    name: 'Maria Santos',
    role: UserRole.ENGINEER,
    isActive: true,
  });
  await userRepository.save(technicalUser);
  console.log('✅ Technical user created');

  // Create sample clients
  const clients = [
    {
      name: 'Indústria Metalúrgica Silva Ltda',
      document: '12.345.678/0001-90',
      email: 'contato@metalurgicasilva.com.br',
      phone: '(71) 3333-4444',
      address: 'Av. Industrial, 1000',
      city: 'Salvador',
      state: 'BA',
      segment: ClientSegment.INDUSTRIAL,
      classification: ClientClassification.A,
      notes: 'Cliente ouro',
    },
    {
      name: 'Condomínio Residencial Parque Verde',
      document: '12.345.678/0001-91',
      email: 'admin@parqueverde.com.br',
      phone: '(71) 3333-5555',
      address: 'Rua das Palmeiras, 500',
      city: 'Salvador',
      state: 'BA',
      segment: ClientSegment.CONDOMINIUM,
      classification: ClientClassification.B,
    },
    {
      name: 'Supermercado Bom Preço',
      document: '12.345.678/0001-92',
      email: 'compras@bompreco.com.br',
      phone: '(71) 3333-6666',
      address: 'Av. Shopping, 200',
      city: 'Lauro de Freitas',
      state: 'BA',
      segment: ClientSegment.COMMERCIAL,
      classification: ClientClassification.A,
    },
    {
      name: 'Residencial Família Oliveira',
      document: '123.456.789-00',
      email: 'oliveira@email.com.br',
      phone: '(71) 99999-1111',
      address: 'Rua das Flores, 45',
      city: 'Salvador',
      state: 'BA',
      segment: ClientSegment.RESIDENTIAL,
      classification: ClientClassification.C,
    },
    {
      name: 'Hospital São Lucas',
      document: '12.345.678/0001-93',
      email: 'engenharia@saolucas.com.br',
      phone: '(71) 3333-7777',
      address: 'Av. da Saúde, 1000',
      city: 'Salvador',
      state: 'BA',
      segment: ClientSegment.COMMERCIAL,
      classification: ClientClassification.A,
    },
  ];

  const savedClients = await clientRepository.save(clients.map(c => clientRepository.create(c)));
  console.log('✅ Sample clients created');

  // Create sample leads
  const leads = [
    {
      name: 'Carlos Eduardo Mendes',
      email: 'carlos.mendes@email.com',
      phone: '(71) 98888-2222',
      source: LeadSource.PORTAL,
      status: LeadStatus.QUALIFIED,
      description: 'Indústria de plásticos, necessita upgrade completo',
      assignedToId: commercialUser.id,
    },
    {
      name: 'Fernanda Lima',
      email: 'fernanda@condominio.com',
      phone: '(71) 97777-3333',
      source: LeadSource.INDICATION,
      status: LeadStatus.NEW,
      description: 'Condomínio com 80 unidades. PDE - Projeto de Entrada de Energia',
      assignedToId: commercialUser.id,
    },
    {
      name: 'Roberto Almeida',
      email: 'roberto@loja.com',
      phone: '(71) 96666-4444',
      source: LeadSource.WHATSAPP,
      status: LeadStatus.QUALIFYING,
      description: 'Loja de 200m², conta de luz alta. Instalação de Energia Solar',
      assignedToId: commercialUser.id,
    },
  ];

  await leadRepository.save(leads.map(l => leadRepository.create(l)));
  console.log('✅ Sample leads created');

  // Create sample opportunities
  const opportunities = [
    {
      title: 'Projeto Elétrico Completo - Indústria Silva',
      client: savedClients[0],
      stage: OpportunityStage.PROPOSAL,
      estimatedValue: 45000,
      probability: 70,
      expectedCloseDate: new Date('2024-03-15'),
      description: 'Projeto elétrico completo para expansão da linha de produção',
      serviceType: 'Indicação',
      assignedToId: commercialUser.id,
    },
    {
      title: 'PDE - Condomínio Parque Verde',
      client: savedClients[1],
      stage: OpportunityStage.NEGOTIATION,
      estimatedValue: 28000,
      probability: 85,
      expectedCloseDate: new Date('2024-02-28'),
      description: 'Projeto de entrada de energia para novo bloco',
      serviceType: 'Cliente Existente',
      assignedToId: commercialUser.id,
    },
    {
      title: 'Sistema Solar 50kW - Supermercado',
      client: savedClients[2],
      stage: OpportunityStage.QUALIFICATION,
      estimatedValue: 180000,
      probability: 40,
      expectedCloseDate: new Date('2024-04-30'),
      description: 'Sistema fotovoltaico para redução de custos',
      serviceType: 'Website',
      assignedToId: commercialUser.id,
    },
    {
      title: 'Laudo SPDA - Hospital São Lucas',
      client: savedClients[4],
      stage: OpportunityStage.CLOSED_WON,
      estimatedValue: 15000,
      probability: 100,
      expectedCloseDate: new Date('2024-01-20'),
      description: 'Laudo técnico de SPDA para renovação de AVCB',
      serviceType: 'Cliente Existente',
      assignedToId: commercialUser.id,
    },
  ];

  const savedOpportunities = await opportunityRepository.save(opportunities.map(o => opportunityRepository.create(o)));
  console.log('✅ Sample opportunities created');

  // Create sample works
  const works = [
    {
      title: 'Projeto Elétrico - Indústria Silva',
      client: savedClients[0],
      type: WorkType.PROJECT_MT,
      status: WorkStatus.IN_PROGRESS,
      startDate: new Date('2024-01-10'),
      deadline: new Date('2024-03-10'),
      totalValue: 45000,
      technicalData: {
        power: 500,
        voltage: '380V',
      },
      assignedEngineerId: technicalUser.id,
    },
    {
      title: 'PDE - Condomínio Parque Verde',
      client: savedClients[1],
      type: WorkType.PDE_BT,
      status: WorkStatus.IN_PROGRESS,
      startDate: new Date('2024-01-15'),
      deadline: new Date('2024-02-28'),
      totalValue: 28000,
      technicalData: {
        power: 225,
        voltage: '380V',
        units: 80,
      },
      assignedEngineerId: technicalUser.id,
    },
    {
      title: 'Laudo SPDA - Hospital São Lucas',
      client: savedClients[4],
      type: WorkType.SPDA,
      status: WorkStatus.COMPLETED,
      startDate: new Date('2024-01-05'),
      endDate: new Date('2024-01-18'),
      deadline: new Date('2024-01-20'),
      totalValue: 15000,
      technicalData: {
        // buildingHeight: '45m', // Not in entity
        // protectionLevel: 'III', // Not in entity
      },
      notes: 'Altura: 45m, Nível de proteção: III, Estrutura Metálica', // Moved extra data to notes
      assignedEngineerId: technicalUser.id,
    },
  ];

  const savedWorks = await workRepository.save(works.map(w => workRepository.create(w)));
  console.log('✅ Sample works created');

  // Create sample processes with stages
  const processes = [
    {
      work: savedWorks[0],
      name: 'Fluxo Padrão - Projeto Elétrico',
      status: ProcessStatus.IN_PROGRESS,
      currentStage: 2,
      stages: [
        {
          name: 'Levantamento Técnico',
          description: 'Visita ao local e levantamento de dados',
          order: 1,
          status: ProcessStatus.COMPLETED,
          checklist: [
            { description: 'Visita técnica realizada', isCompleted: true },
            { description: 'Fotos documentadas', isCompleted: true },
            { description: 'Memorial descritivo', isCompleted: true },
          ],
          completedAt: new Date('2024-01-12'),
        },
        {
          name: 'Projeto Executivo',
          description: 'Desenvolvimento do projeto executivo',
          order: 2,
          status: ProcessStatus.IN_PROGRESS,
          checklist: [
            { description: 'Diagrama unifilar', isCompleted: true },
            { description: 'Planta de localização', isCompleted: true },
            { description: 'Detalhamento de quadros', isCompleted: false },
            { description: 'Memorial de cálculo', isCompleted: false },
          ],
        },
        {
          name: 'Aprovação Cliente',
          description: 'Aprovação do projeto pelo cliente',
          order: 3,
          status: ProcessStatus.NOT_STARTED,
          checklist: [
            { description: 'Apresentação ao cliente', isCompleted: false },
            { description: 'Ajustes solicitados', isCompleted: false },
            { description: 'Aprovação final', isCompleted: false },
          ],
        },
        {
          name: 'Protocolo na Concessionária',
          description: 'Envio para aprovação da concessionária',
          order: 4,
          status: ProcessStatus.NOT_STARTED,
          checklist: [
            { description: 'Documentação completa', isCompleted: false },
            { description: 'Protocolo aberto', isCompleted: false },
            { description: 'Aprovação obtida', isCompleted: false },
          ],
        },
      ],
    },
    {
      work: savedWorks[1],
      name: 'Fluxo PDE',
      status: ProcessStatus.IN_PROGRESS,
      currentStage: 1,
      stages: [
        {
          name: 'Documentação Inicial',
          description: 'Coleta de documentos do cliente',
          order: 1,
          status: ProcessStatus.IN_PROGRESS,
          checklist: [
            { description: 'Contrato social', isCompleted: true },
            { description: 'Cartão CNPJ', isCompleted: true },
            { description: 'Conta de energia', isCompleted: false },
            { description: 'ART do responsável', isCompleted: false },
          ],
        },
        {
          name: 'Projeto Técnico',
          description: 'Elaboração do projeto técnico',
          order: 2,
          status: ProcessStatus.NOT_STARTED,
          checklist: [
            { description: 'Diagrama unifilar', isCompleted: false },
            { description: 'Planta baixa', isCompleted: false },
            { description: 'Especificação de materiais', isCompleted: false },
          ],
        },
        {
          name: 'Protocolo Neoenergia',
          description: 'Envio para a concessionária',
          order: 3,
          status: ProcessStatus.NOT_STARTED,
          checklist: [
            { description: 'Cadastro no portal', isCompleted: false },
            { description: 'Upload de documentos', isCompleted: false },
            { description: 'Acompanhamento do protocolo', isCompleted: false },
          ],
        },
      ],
    },
  ];

  await processRepository.save(processRepository.create(processes as any));
  console.log('✅ Sample processes created');

  // Create sample tasks
  const tasks = [
    {
      title: 'Revisar projeto executivo',
      description: 'Revisão final antes de enviar ao cliente',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: new Date('2024-02-10'),
      assignedTo: technicalUser,
      work: savedWorks[0],
    },
    {
      title: 'Solicitar documentos ao cliente',
      description: 'Enviar lista de documentos necessários para o PDE',
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date('2024-02-05'),
      assignedTo: commercialUser,
      work: savedWorks[1],
    },
    {
      title: 'Atualizar status de protocolos',
      description: 'Verificar status dos protocolos pendentes na Neoenergia',
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      dueDate: new Date('2024-02-03'),
      assignedTo: technicalUser,
    },
    {
      title: 'Elaborar proposta comercial',
      description: 'Preparar proposta para o sistema solar',
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date('2024-01-25'),
      assignedTo: commercialUser,
      work: savedWorks[2],
    },
  ];

  await taskRepository.save(tasks.map(t => taskRepository.create(t)));
  console.log('✅ Sample tasks created');

  // Create sample proposals
  const proposals = [
    {
      proposalNumber: 'PROP-2024-001',
      opportunity: savedOpportunities[0],
      client: savedClients[0],
      title: 'Projeto Elétrico Completo',
      description: 'Projeto elétrico para expansão da linha de produção',
      items: [
        { description: 'Projeto Executivo', quantity: 1, unitPrice: 25000, total: 25000 },
        { description: 'ART', quantity: 1, unitPrice: 5000, total: 5000 },
        { description: 'Acompanhamento', quantity: 1, unitPrice: 10000, total: 10000 },
        { description: 'As Built', quantity: 1, unitPrice: 5000, total: 5000 },
      ],
      subtotal: 45000,
      discount: 0,
      total: 45000,
      status: ProposalStatus.SENT,
      validUntil: new Date('2024-03-01'),
      paymentTerms: '30% entrada, 40% aprovação, 30% entrega',
      deliveryTime: '45 dias úteis',
      createdBy: commercialUser,
    },
    {
      proposalNumber: 'PROP-2024-002',
      opportunity: savedOpportunities[1],
      client: savedClients[1],
      title: 'PDE - Projeto de Entrada de Energia',
      description: 'Projeto de entrada de energia para novo bloco do condomínio',
      items: [
        { description: 'Projeto Técnico', quantity: 1, unitPrice: 15000, total: 15000 },
        { description: 'ART', quantity: 1, unitPrice: 3000, total: 3000 },
        { description: 'Protocolo Concessionária', quantity: 1, unitPrice: 5000, total: 5000 },
        { description: 'Acompanhamento', quantity: 1, unitPrice: 5000, total: 5000 },
      ],
      subtotal: 28000,
      discount: 0,
      total: 28000,
      status: ProposalStatus.ACCEPTED,
      validUntil: new Date('2024-02-20'),
      paymentTerms: '50% entrada, 50% aprovação',
      deliveryTime: '30 dias úteis',
      createdBy: commercialUser,
    },
  ];

  await proposalRepository.save(proposals.map(p => proposalRepository.create(p)));
  console.log('✅ Sample proposals created');

  // Create sample protocols
  const protocols = [
    {
      protocolNumber: 'NEO-2024-001234',
      work: savedWorks[0],
      // type: ProtocolType.APPROVAL, // Not in entity
      concessionaria: 'Neoenergia Coelba', // mapped from utilityCompany
      status: ProtocolStatus.OPEN,
      slaDays: 30,
      openedAt: new Date('2024-01-20'),
      // expectedResponseAt // Not in entity
      // documents: ... // Not in entity, maybe moved to relation or ignored for seed
      description: 'Tipo: Aprovação. Aguardando análise técnica', // Combined notes and type
    },
    {
      protocolNumber: 'NEO-2024-001235',
      work: savedWorks[1],
      // type: ProtocolType.CONNECTION,
      concessionaria: 'Neoenergia Coelba',
      status: ProtocolStatus.IN_ANALYSIS,
      slaDays: 45,
      openedAt: new Date('2024-01-25'),
      description: 'Tipo: Ligação Nova. Em análise pelo departamento técnico',
    },
  ];

  await protocolRepository.save(protocols.map(p => protocolRepository.create(p)));
  console.log('✅ Sample protocols created');

  // Create sample rules for cross-sell
  const rules = [
    {
      name: 'Sugestão de SPDA para Projetos Industriais',
      description: 'Sugere laudo de SPDA quando o cliente é industrial e tem projeto elétrico',
      priority: 1,
      conditions: [
        { field: RuleCondition.CLIENT_SEGMENT, operator: 'equals', value: 'INDUSTRIAL' },
        { field: RuleCondition.SERVICE_TYPE, operator: 'equals', value: 'PROJECT_MT' },
      ],
      actions: [
        { type: RuleAction.SUGGEST_PACKAGE, params: { service: 'SPDA', message: 'Cliente industrial precisa de SPDA atualizado' } },
      ],
      messageTemplate: 'O cliente {client.name} possui instalação industrial. Considere oferecer um laudo de SPDA.',
      isActive: true,
    },
    {
      name: 'Sugestão de Energia Solar para Comerciais',
      description: 'Sugere energia solar para clientes comerciais',
      priority: 2,
      conditions: [
        { field: RuleCondition.CLIENT_SEGMENT, operator: 'in', value: ['COMMERCIAL', 'INDUSTRIAL'] },
        // { field: 'opportunity.value', operator: 'greater_than', value: 50000 }, // opportunity.value not in RuleCondition enum?
        { field: RuleCondition.POWER, operator: 'greater_than', value: 50 }, // Approximation
      ],
      actions: [
        { type: RuleAction.SUGGEST_PACKAGE, params: { service: 'SOLAR', message: 'Alto consumo - sugerir análise de viabilidade solar' } },
      ],
      messageTemplate: 'O cliente {client.name} tem alto valor de projeto. Sugira uma análise de viabilidade para energia solar.',
      isActive: true,
    },
    // Removed complex rules that don't match simple conditions easily
  ];

  // Fix RuleCondition typo in the array above if needed, check enum
  // RuleCondition members: SERVICE_TYPE, VOLTAGE, POWER, CONSUMPTION, CLIENT_SEGMENT, HAS_DONATION, HAS_UTILITY, HAS_SPDA, HAS_REPORT, DAYS_SINCE_LAST_REPORT, UNITS_COUNT, CONCESSIONARIA.
  // So 'opportunity.value' is not there. I changed it to POWER as a placeholder.

  // Re-define rules with correct types to avoid TS errors
  const validRules = [
    {
      name: 'Sugestão de SPDA para Projetos Industriais',
      description: 'Sugere laudo de SPDA quando o cliente é industrial e tem projeto elétrico',
      priority: 1,
      conditions: [
        { field: RuleCondition.CLIENT_SEGMENT, operator: 'equals', value: 'industrial' },
        { field: RuleCondition.SERVICE_TYPE, operator: 'equals', value: 'project_mt' },
      ],
      actions: [
        { type: RuleAction.SUGGEST_PACKAGE, params: { service: 'spda', message: 'Cliente industrial precisa de SPDA atualizado' } },
      ],
      messageTemplate: 'O cliente {client.name} possui instalação industrial. Considere oferecer um laudo de SPDA.',
      isActive: true,
    },
  ];

  await ruleRepository.save(ruleRepository.create(validRules as any)); // Cast as any to avoid strict typing issues with enums in simple-json columns if necessary
  console.log('✅ Sample rules created');

  // Create sample packages
  const packages = [
    {
      name: 'Pacote Básico - PDE',
      description: 'Projeto de Entrada de Energia com documentação completa',
      code: 'PDE',
      basePrice: 15000,
      includedServices: [
        'Projeto Técnico',
        'ART',
        'Protocolo',
      ],
      estimatedDays: 30,
      isActive: true,
    },
    {
      name: 'Pacote Completo - Projeto Elétrico',
      description: 'Projeto elétrico completo para indústrias',
      code: 'ELECTRICAL_PROJECT',
      basePrice: 35000,
      includedServices: [
        'Levantamento Técnico',
        'Projeto Executivo',
        'ART',
        'Acompanhamento',
        'As Built',
      ],
      estimatedDays: 45,
      isActive: true,
    },
    {
      name: 'Laudo SPDA Express',
      description: 'Laudo técnico de SPDA com emissão de ART',
      code: 'SPDA_REPORT',
      basePrice: 8000,
      includedServices: [
        'Inspeção Técnica',
        'Laudo',
        'ART',
      ],
      estimatedDays: 10,
      isActive: true,
    },
    {
      name: 'Energia Solar - Análise',
      description: 'Estudo de viabilidade para sistema fotovoltaico',
      code: 'SOLAR_INSTALLATION',
      basePrice: 5000,
      includedServices: [
        'Análise de Conta',
        'Estudo de Viabilidade',
        'Proposta Técnica',
      ],
      estimatedDays: 7,
      isActive: true,
    },
  ];

  await packageRepository.save(packages.map(p => packageRepository.create(p)));
  console.log('✅ Sample packages created');

  console.log('✅ Database seed completed successfully!');
}
