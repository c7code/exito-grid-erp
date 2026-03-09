import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceOrder, ServiceOrderStatus } from './service-order.entity';
import { WorkCost, WorkCostCategory, WorkCostStatus } from '../finance/work-cost.entity';
import { Notification } from '../notifications/notification.entity';

@Injectable()
export class ServiceOrdersService {
    constructor(
        @InjectRepository(ServiceOrder)
        private soRepo: Repository<ServiceOrder>,
        @InjectRepository(WorkCost)
        private workCostRepo: Repository<WorkCost>,
        @InjectRepository(Notification)
        private notificationRepo: Repository<Notification>,
    ) { }

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
