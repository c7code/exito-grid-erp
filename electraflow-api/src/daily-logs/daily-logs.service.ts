import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyLog } from './daily-log.entity';

@Injectable()
export class DailyLogsService {
    constructor(
        @InjectRepository(DailyLog)
        private dailyLogRepo: Repository<DailyLog>,
    ) { }

    async findAll(workId?: string) {
        const query = this.dailyLogRepo
            .createQueryBuilder('log')
            .leftJoinAndSelect('log.work', 'work')
            .leftJoinAndSelect('log.createdBy', 'createdBy')
            .where('log.deletedAt IS NULL')
            .orderBy('log.date', 'DESC');

        if (workId) {
            query.andWhere('log.workId = :workId', { workId });
        }

        return query.getMany();
    }

    async findOne(id: string) {
        const log = await this.dailyLogRepo.findOne({
            where: { id },
            relations: ['work', 'createdBy'],
        });
        if (!log) throw new NotFoundException('Diário de obra não encontrado');
        return log;
    }

    async findByWorkAndDate(workId: string, date: string) {
        return this.dailyLogRepo.findOne({
            where: { workId, date: new Date(date) as any },
            relations: ['work', 'createdBy'],
        });
    }

    async create(data: Partial<DailyLog>) {
        const log = this.dailyLogRepo.create(data);
        return this.dailyLogRepo.save(log);
    }

    async update(id: string, data: Partial<DailyLog>) {
        const log = await this.findOne(id);
        Object.assign(log, data);
        return this.dailyLogRepo.save(log);
    }

    async remove(id: string) {
        const log = await this.findOne(id);
        return this.dailyLogRepo.softRemove(log);
    }

    async sign(id: string, signedBy: string) {
        const log = await this.findOne(id);
        log.isSigned = true;
        log.signedBy = signedBy;
        return this.dailyLogRepo.save(log);
    }

    async getStatsByWork(workId: string) {
        const logs = await this.dailyLogRepo.find({ where: { workId } });
        return {
            totalDays: logs.length,
            totalWorkers: logs.reduce((sum, l) => sum + (l.workersPresent || 0), 0),
            rainyDays: logs.filter(l =>
                l.weatherMorning === 'rainy' || l.weatherAfternoon === 'rainy' ||
                l.weatherMorning === 'stormy' || l.weatherAfternoon === 'stormy'
            ).length,
            averageWorkers: logs.length > 0
                ? Math.round(logs.reduce((sum, l) => sum + (l.workersPresent || 0), 0) / logs.length)
                : 0,
        };
    }
}
