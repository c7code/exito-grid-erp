import { Injectable, NotFoundException, Logger, OnModuleInit, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ServiceOrder, ServiceOrderStatus } from './service-order.entity';
import { WorkCost, WorkCostCategory, WorkCostStatus } from '../finance/work-cost.entity';
import { Notification } from '../notifications/notification.entity';

const VALID_SO_TRANSITIONS: Record<string, string[]> = {
  'draft': ['open', 'cancelled'],
  'open': ['in_progress', 'cancelled'],
  'in_progress': ['completed', 'paused', 'cancelled'],
  'paused': ['in_progress', 'cancelled'],
  'completed': ['closed'],
  'closed': [],
  'cancelled': ['draft'],
};

@Injectable()
export class ServiceOrdersService implements OnModuleInit {
    private readonly logger = new Logger(ServiceOrdersService.name);

    constructor(
        @InjectRepository(ServiceOrder)
        private soRepo: Repository<ServiceOrder>,
        @InjectRepository(WorkCost)
        private workCostRepo: Repository<WorkCost>,
        @InjectRepository(Notification)
        private notificationRepo: Repository<Notification>,
        private dataSource: DataSource,
    ) { }

    async onModuleInit() {
        try {
            // Create enum types if they don't exist
            await this.dataSource.query(`
                DO $$ BEGIN
                    CREATE TYPE service_order_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled', 'on_hold');
                EXCEPTION WHEN duplicate_object THEN NULL;
                END $$;
            `);
            await this.dataSource.query(`
                DO $$ BEGIN
                    CREATE TYPE service_order_priority AS ENUM ('low', 'medium', 'high', 'urgent');
                EXCEPTION WHEN duplicate_object THEN NULL;
                END $$;
            `);

            // Create table if not exists
            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS service_orders (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    code VARCHAR UNIQUE,
                    title VARCHAR NOT NULL,
                    description TEXT,
                    status service_order_status DEFAULT 'open',
                    priority service_order_priority DEFAULT 'medium',
                    category VARCHAR,
                    "workId" UUID REFERENCES works(id),
                    "clientId" UUID REFERENCES clients(id),
                    "assignedToId" UUID REFERENCES users(id),
                    address VARCHAR,
                    city VARCHAR,
                    state VARCHAR,
                    "scheduledDate" TIMESTAMP,
                    "startTime" VARCHAR,
                    "endTime" VARCHAR,
                    "hoursWorked" DECIMAL(5,2),
                    checklist TEXT,
                    "materialsUsed" TEXT,
                    photos TEXT,
                    "clientSignature" TEXT,
                    "clientSignedName" VARCHAR,
                    "clientSignedAt" TIMESTAMP,
                    "technicianNotes" TEXT,
                    "clientNotes" TEXT,
                    "laborCost" DECIMAL(15,2) DEFAULT 0,
                    "materialCost" DECIMAL(15,2) DEFAULT 0,
                    "totalCost" DECIMAL(15,2) DEFAULT 0,
                    "createdById" UUID REFERENCES users(id),
                    "completedAt" TIMESTAMP,
                    "createdAt" TIMESTAMP DEFAULT NOW(),
                    "updatedAt" TIMESTAMP DEFAULT NOW(),
                    "deletedAt" TIMESTAMP
                )
            `);
            this.logger.log('✅ Tabela service_orders verificada/criada');
        } catch (e) {
            this.logger.warn('⚠️ Erro ao verificar/criar tabela service_orders: ' + e?.message);
        }
    }

    async findAll(filters?: { status?: string; workId?: string; assignedToId?: string }) {
        const query = this.soRepo
            .createQueryBuilder('so')
            .leftJoinAndSelect('so.work', 'work')
            .leftJoinAndSelect('so.client', 'client')
            .leftJoinAndSelect('so.assignedTo', 'assignedTo')
            .leftJoinAndSelect('so.createdBy', 'createdBy')
            .where('so.deletedAt IS NULL')
            .orderBy('so.scheduledDate', 'ASC');

        if (filters?.status) query.andWhere('so.status = :status', { status: filters.status });
        if (filters?.workId) query.andWhere('so.workId = :workId', { workId: filters.workId });
        if (filters?.assignedToId) query.andWhere('so.assignedToId = :assignedToId', { assignedToId: filters.assignedToId });

        return query.getMany();
    }

    async findOne(id: string) {
        const so = await this.soRepo.findOne({
            where: { id },
            relations: ['work', 'client', 'assignedTo', 'createdBy'],
        });
        if (!so) throw new NotFoundException('Ordem de serviço não encontrada');
        return so;
    }

    async create(data: Partial<ServiceOrder>) {
        // Auto-generate code
        const count = await this.soRepo.count();
        const code = `OS-${String(count + 1).padStart(5, '0')}`;

        const so = this.soRepo.create({ ...data, code });
        return this.soRepo.save(so);
    }

    async update(id: string, data: Partial<ServiceOrder>) {
        const so = await this.findOne(id);

        // Validate status transition
        if (data.status && data.status !== so.status) {
            const allowed = VALID_SO_TRANSITIONS[so.status] || [];
            if (!allowed.includes(data.status)) {
                throw new BadRequestException(`Transição de status inválida: ${so.status} → ${data.status}`);
            }
        }

        const wasNotCompleted = so.status !== ServiceOrderStatus.COMPLETED;
        Object.assign(so, data);

        // Auto-calculate total cost
        if (data.laborCost !== undefined || data.materialCost !== undefined) {
            so.totalCost = Number(so.laborCost || 0) + Number(so.materialCost || 0);
        }

        // Auto-set completedAt
        if (data.status === ServiceOrderStatus.COMPLETED && !so.completedAt) {
            so.completedAt = new Date();
        }

        const saved = await this.soRepo.save(so);

        // ── AUTO-TRIGGER: OS completed → Create WorkCost entry ──────────
        if (wasNotCompleted && data.status === ServiceOrderStatus.COMPLETED && so.workId && Number(so.totalCost || 0) > 0) {
            try {
                await this.workCostRepo.save(
                    this.workCostRepo.create({
                        workId: so.workId,
                        description: `OS ${so.code} - ${so.title || 'Ordem de Serviço'}`,
                        category: WorkCostCategory.SUBCONTRACT,
                        quantity: 1,
                        unit: 'sv',
                        unitPrice: Number(so.totalCost),
                        totalPrice: Number(so.totalCost),
                        date: new Date(),
                        notes: `Lançamento automático da OS ${so.code} concluída`,
                        status: WorkCostStatus.PENDING,
                    }),
                );
                await this.notificationRepo.save(
                    this.notificationRepo.create({
                        title: '💰 Custo Lançado Automaticamente',
                        message: `OS ${so.code} concluída → Custo de R$ ${Number(so.totalCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} lançado na obra`,
                        type: 'auto_cost_created',
                        category: 'finance',
                    }),
                );
            } catch (err) {
                console.error('[AutoTrigger] Failed to auto-create work cost from OS:', err?.message);
            }
        }

        return saved;
    }

    async remove(id: string) {
        const so = await this.findOne(id);
        return this.soRepo.softRemove(so);
    }

    async clientSign(id: string, data: { signature: string; name: string }) {
        const so = await this.findOne(id);
        so.clientSignature = data.signature;
        so.clientSignedName = data.name;
        so.clientSignedAt = new Date();
        return this.soRepo.save(so);
    }

    async getStats() {
        const all = await this.soRepo.find({ where: { deletedAt: null as any } });
        return {
            total: all.length,
            open: all.filter(s => s.status === ServiceOrderStatus.OPEN).length,
            inProgress: all.filter(s => s.status === ServiceOrderStatus.IN_PROGRESS).length,
            completed: all.filter(s => s.status === ServiceOrderStatus.COMPLETED).length,
            totalRevenue: all.reduce((sum, s) => sum + Number(s.totalCost || 0), 0),
        };
    }
}
