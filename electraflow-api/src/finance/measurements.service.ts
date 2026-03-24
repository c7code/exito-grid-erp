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
            relations: ['work', 'work.client', 'items', 'items.task'],
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

        // Calculate accumulated percentage from previous measurements
        const previousMeasurements = await this.measurementRepository.find({
            where: { workId },
            order: { number: 'ASC' },
        });
        const accumulatedBefore = previousMeasurements.reduce(
            (sum, m) => sum + Number(m.executedPercentage || 0), 0,
        );

        // Calculate derived values
        const contractValue = Number(data.contractValue || 0);
        const directBillingTotal = Number(data.directBillingTotal || 0);
        const baseValue = contractValue - directBillingTotal;
        const executedPercentage = Number(data.executedPercentage || 0);
        const accumulatedPercentage = accumulatedBefore + executedPercentage;
        const totalAmount = baseValue * (executedPercentage / 100);
        const retentionAmount = Number(data.retentionAmount || 0);
        const taxAmount = Number(data.taxAmount || 0);
        const netAmount = totalAmount - retentionAmount - taxAmount;

        const measurement = this.measurementRepository.create({
            ...data,
            workId,
            number: nextNumber,
            status: MeasurementStatus.DRAFT,
            contractValue,
            directBillingTotal,
            baseValue,
            executedPercentage,
            accumulatedPercentage,
            totalAmount,
            retentionAmount,
            taxAmount,
            netAmount,
        });

        return this.measurementRepository.save(measurement);
    }

    async update(id: string, data: Partial<Measurement>): Promise<Measurement> {
        const measurement = await this.findOne(id);
        if (measurement.status !== MeasurementStatus.DRAFT) {
            throw new Error('Apenas medições em rascunho podem ser editadas');
        }

        // Recalculate accumulated percentage (excluding this measurement)
        const previousMeasurements = await this.measurementRepository.find({
            where: { workId: measurement.workId },
            order: { number: 'ASC' },
        });
        const accumulatedBefore = previousMeasurements
            .filter(m => m.id !== id)
            .reduce((sum, m) => sum + Number(m.executedPercentage || 0), 0);

        // Update scalar values
        const contractValue = Number(data.contractValue ?? measurement.contractValue);
        const directBillingTotal = Number(data.directBillingTotal ?? measurement.directBillingTotal);
        const baseValue = contractValue - directBillingTotal;
        const executedPercentage = Number(data.executedPercentage ?? measurement.executedPercentage);
        const accumulatedPercentage = accumulatedBefore + executedPercentage;
        const totalAmount = baseValue * (executedPercentage / 100);
        const retentionAmount = Number(data.retentionAmount ?? measurement.retentionAmount);
        const taxAmount = Number(data.taxAmount ?? measurement.taxAmount);
        const netAmount = totalAmount - retentionAmount - taxAmount;

        // Remove relation objects to avoid TypeORM conflicts
        const { work, items, ...cleanData } = data as any;

        const updateData: any = {
            ...cleanData,
            contractValue,
            directBillingTotal,
            baseValue,
            executedPercentage,
            accumulatedPercentage,
            totalAmount,
            retentionAmount,
            taxAmount,
            netAmount,
        };

        // Remove undefined values
        for (const key of Object.keys(updateData)) {
            if (updateData[key] === undefined) delete updateData[key];
        }

        await this.measurementRepository.update(id, updateData);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        const measurement = await this.findOne(id);
        if (measurement.status !== MeasurementStatus.DRAFT) {
            throw new Error('Apenas medições em rascunho podem ser excluídas');
        }
        await this.measurementRepository.softDelete(id);
    }

    async getBalance(workId: string): Promise<any> {
        const measurements = await this.measurementRepository.find({
            where: { workId },
            order: { number: 'ASC' },
        });

        if (measurements.length === 0) {
            return {
                contractValue: 0,
                directBillingTotal: 0,
                baseValue: 0,
                totalExecuted: 0,
                totalExecutedPercentage: 0,
                remainingBalance: 0,
                remainingPercentage: 100,
                measurements: [],
            };
        }

        const latest = measurements[measurements.length - 1];
        const contractValue = Number(latest.contractValue || 0);
        const directBillingTotal = Number(latest.directBillingTotal || 0);
        const baseValue = contractValue - directBillingTotal;
        const totalExecuted = measurements.reduce((sum, m) => sum + Number(m.totalAmount || 0), 0);
        const totalExecutedPercentage = measurements.reduce(
            (sum, m) => sum + Number(m.executedPercentage || 0), 0,
        );

        return {
            contractValue,
            directBillingTotal,
            baseValue,
            totalExecuted,
            totalExecutedPercentage,
            remainingBalance: baseValue - totalExecuted,
            remainingPercentage: 100 - totalExecutedPercentage,
            measurements: measurements.map(m => ({
                id: m.id,
                number: m.number,
                status: m.status,
                executedPercentage: Number(m.executedPercentage),
                totalAmount: Number(m.totalAmount),
                netAmount: Number(m.netAmount),
                startDate: m.startDate,
                endDate: m.endDate,
            })),
        };
    }

    async approve(id: string): Promise<Measurement> {
        const measurement = await this.findOne(id);
        measurement.status = MeasurementStatus.APPROVED;

        // Auto-generate "Conta a Receber"
        await this.financeService.create({
            workId: measurement.workId,
            clientId: measurement.work?.clientId,
            measurementId: measurement.id,
            description: `Medição #${measurement.number} - ${measurement.work?.title || 'Obra'}`,
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
        await this.itemRepository.softDelete({ measurementId: id });

        let totalCalculated = 0;
        const items = tasks.map(task => {
            const progressDelta = task.progress;
            const weight = task.weightPercentage || 0;
            const contractVal = Number(measurement.baseValue || measurement.work?.totalValue || 0);
            const taskValue = (contractVal * (weight / 100)) * (progressDelta / 100);

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
        if (measurement.retentionAmount === 0) {
            measurement.retentionAmount = totalCalculated * 0.05;
        }
        measurement.netAmount = measurement.totalAmount - measurement.retentionAmount - measurement.taxAmount;

        return this.measurementRepository.save(measurement);
    }
}
