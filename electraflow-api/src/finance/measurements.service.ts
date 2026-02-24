import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Measurement, MeasurementStatus } from './measurement.entity';
import { MeasurementItem } from './measurement-item.entity';
import { Task } from '../tasks/task.entity';
import { FinanceService } from './finance.service';
import { PaymentType, TransactionCategory } from './payment.entity';

@Injectable()
export class MeasurementsService {
    constructor(
        @InjectRepository(Measurement)
        private measurementRepository: Repository<Measurement>,
        @InjectRepository(MeasurementItem)
        private itemRepository: Repository<MeasurementItem>,
        @InjectRepository(Task)
        private taskRepository: Repository<Task>,
        private financeService: FinanceService,
    ) { }

    async findAll(workId?: string): Promise<Measurement[]> {
        const where: any = {};
        if (workId) where.workId = workId;
        return this.measurementRepository.find({
            where,
            relations: ['work', 'items', 'items.task'],
            order: { number: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Measurement> {
        const measurement = await this.measurementRepository.findOne({
            where: { id },
            relations: ['work', 'work.client', 'items', 'items.task'],
        });
        if (!measurement) throw new NotFoundException('Medição não encontrada');
        return measurement;
    }

    async create(workId: string, data: Partial<Measurement>): Promise<Measurement> {
        const lastMeasurement = await this.measurementRepository.findOne({
            where: { workId },
            order: { number: 'DESC' },
        });

        const nextNumber = (lastMeasurement?.number || 0) + 1;
        const measurement = this.measurementRepository.create({
            ...data,
            workId,
            number: nextNumber,
            status: MeasurementStatus.DRAFT,
        });

        return this.measurementRepository.save(measurement);
    }

    async approve(id: string): Promise<Measurement> {
        const measurement = await this.findOne(id);
        measurement.status = MeasurementStatus.APPROVED;

        // Auto-generate "Conta a Receber"
        await this.financeService.create({
            workId: measurement.workId,
            clientId: measurement.work.clientId,
            measurementId: measurement.id,
            description: `Medição #${measurement.number} - ${measurement.work.title}`,
            amount: measurement.netAmount,
            type: PaymentType.INCOME,
            category: TransactionCategory.PROJECT,
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days default
        });

        return this.measurementRepository.save(measurement);
    }

    async calculateFromTasks(id: string): Promise<Measurement> {
        const measurement = await this.findOne(id);
        const tasks = await this.taskRepository.find({ where: { workId: measurement.workId } });

        // Clear existing items
        await this.itemRepository.delete({ measurementId: id });

        let totalCalculated = 0;
        const items = tasks.map(task => {
            // Find previous measurement progress for this task
            // Simplified: current progress - last approved measurement progress
            // For now, using current task progress as the delta if first measurement
            const progressDelta = task.progress;
            const weight = task.weightPercentage || 0;
            const taskValue = (measurement.work.totalValue * (weight / 100)) * (progressDelta / 100);

            totalCalculated += taskValue;

            return this.itemRepository.create({
                measurementId: id,
                taskId: task.id,
                weightPercentage: weight,
                currentProgress: task.progress,
                calculatedValue: taskValue,
            });
        });

        await this.itemRepository.save(items);

        measurement.totalAmount = totalCalculated;
        // Apply default 5% retention if not set
        if (measurement.retentionAmount === 0) {
            measurement.retentionAmount = totalCalculated * 0.05;
        }
        measurement.netAmount = measurement.totalAmount - measurement.retentionAmount - measurement.taxAmount;

        return this.measurementRepository.save(measurement);
    }
}
