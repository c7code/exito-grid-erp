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

        const previousMeasurements = await this.measurementRepository.find({
            where: { workId },
            order: { number: 'ASC' },
        });

        const measurementType = (data as any).measurementType || 'contract';

        // Acumulado: contrato usa só medições de contrato; aditivo usa só medições do mesmo aditivo
        let accumulatedBefore = 0;
        if (measurementType === 'additive') {
            const additiveDesc = (data as any).additiveDescription || '';
            accumulatedBefore = previousMeasurements
                .filter(m => (m.measurementType || 'contract') === 'additive' &&
                             (m.additiveDescription || '') === additiveDesc)
                .reduce((sum, m) => sum + Number(m.executedPercentage || 0), 0);
        } else {
            accumulatedBefore = previousMeasurements
                .filter(m => (m.measurementType || 'contract') === 'contract')
                .reduce((sum, m) => sum + Number(m.executedPercentage || 0), 0);
        }

        // Calculate derived values
        const contractValue = Number(data.contractValue || 0);
        const directBillingTotal = Number(data.directBillingTotal || 0);
        const baseValue = contractValue - directBillingTotal;
        const executedPercentage = Number(data.executedPercentage || 0);
        const accumulatedPercentage = accumulatedBefore + executedPercentage;
        // Usar totalAmount enviado pelo frontend se disponivel (calculado sobre a base efetiva)
        const totalAmount = Number(data.totalAmount) > 0
            ? Number(data.totalAmount)
            : baseValue * (executedPercentage / 100);
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
            measurementType,
            additiveValue: Number((data as any).additiveValue || 0),
            additiveDescription: (data as any).additiveDescription || null,
            includeMemorial: Boolean((data as any).includeMemorial ?? false),
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
        // Usar totalAmount enviado pelo frontend se disponivel (calculado sobre a base efetiva)
        const totalAmount = Number((data as any).totalAmount) > 0
            ? Number((data as any).totalAmount)
            : baseValue * (executedPercentage / 100);
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
            measurementType: (data as any).measurementType ?? measurement.measurementType ?? 'contract',
            additiveValue: Number((data as any).additiveValue ?? measurement.additiveValue ?? 0),
            additiveDescription: (data as any).additiveDescription ?? measurement.additiveDescription ?? null,
            includeMemorial: Boolean((data as any).includeMemorial ?? measurement.includeMemorial ?? false),
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
                additiveMeasurements: [],
            };
        }

        // Separar medições de contrato e de aditivo
        const contractMsmnts = measurements.filter(m => (m.measurementType || 'contract') === 'contract');
        const additiveMsmnts = measurements.filter(m => (m.measurementType || 'contract') === 'additive');

        // ── Balanço do contrato ──
        const contractValue = Math.max(...contractMsmnts.map(m => Number(m.contractValue || 0)), 0);
        const refMeasurement = contractMsmnts.find(m => Number(m.contractValue) === contractValue) || contractMsmnts[contractMsmnts.length - 1];
        const directBillingTotal = refMeasurement ? Number(refMeasurement.directBillingTotal || 0) : 0;
        const baseValue = contractValue - directBillingTotal;
        const totalExecuted = Math.round(contractMsmnts.reduce((sum, m) => sum + Number(m.totalAmount || 0), 0) * 100) / 100;
        const totalExecutedPercentageRaw = contractMsmnts.reduce((sum, m) => sum + Number(m.executedPercentage || 0), 0);
        const totalExecutedPercentage = Math.round(totalExecutedPercentageRaw * 100) / 100;
        const remainingBalanceRaw = baseValue - totalExecuted;
        const remainingBalance = Math.abs(remainingBalanceRaw) < 0.01 ? 0 : Math.round(remainingBalanceRaw * 100) / 100;
        const remainingPercentageRaw = 100 - totalExecutedPercentage;
        const remainingPercentage = Math.abs(remainingPercentageRaw) < 0.05 ? 0 : Math.round(remainingPercentageRaw * 100) / 100;

        // ── Balanço dos aditivos (agrupados por additiveDescription) ──
        const additiveGroups: Record<string, any> = {};
        for (const m of additiveMsmnts) {
            const key = m.additiveDescription || 'Aditivo';
            if (!additiveGroups[key]) {
                additiveGroups[key] = {
                    description: key,
                    totalValue: Number(m.additiveValue || 0),
                    totalExecuted: 0,
                    totalPercentage: 0,
                    measurements: [],
                };
            }
            additiveGroups[key].totalExecuted += Number(m.totalAmount || 0);
            additiveGroups[key].totalPercentage += Number(m.executedPercentage || 0);
            additiveGroups[key].measurements.push({
                id: m.id,
                number: m.number,
                status: m.status,
                executedPercentage: Number(m.executedPercentage),
                totalAmount: Number(m.totalAmount),
            });
        }
        const additiveMeasurements = Object.values(additiveGroups).map((g: any) => ({
            ...g,
            remainingBalance: Math.max(0, g.totalValue - g.totalExecuted),
            remainingPercentage: Math.max(0, 100 - g.totalPercentage),
        }));

        return {
            contractValue,
            directBillingTotal,
            baseValue,
            totalExecuted,
            totalExecutedPercentage,
            remainingBalance,
            remainingPercentage,
            measurements: contractMsmnts.map(m => ({
                id: m.id,
                number: m.number,
                status: m.status,
                executedPercentage: Number(m.executedPercentage),
                totalAmount: Number(m.totalAmount),
                netAmount: Number(m.netAmount),
                startDate: m.startDate,
                endDate: m.endDate,
            })),
            additiveMeasurements,
        };
    }

    async approve(id: string): Promise<Measurement> {
        const measurement = await this.findOne(id);
        measurement.status = MeasurementStatus.APPROVED;

        const isAdditive = (measurement.measurementType || 'contract') === 'additive';
        const label = isAdditive
            ? `Aditivo #${measurement.number} - ${measurement.additiveDescription || measurement.work?.title || 'Obra'}`
            : `Medição #${measurement.number} - ${measurement.work?.title || 'Obra'}`;

        // Auto-generate "Conta a Receber"
        await this.financeService.create({
            workId: measurement.workId,
            clientId: measurement.work?.clientId,
            measurementId: measurement.id,
            description: label,
            amount: measurement.netAmount,
            type: PaymentType.INCOME,
            category: TransactionCategory.PROJECT,
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
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
