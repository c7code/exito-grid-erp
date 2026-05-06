import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyLog } from './daily-log.entity';
import { DailyLogRequest } from './daily-log-request.entity';
import { DailyLogResponse } from './daily-log-response.entity';

@Injectable()
export class DailyLogsService {
    constructor(
        @InjectRepository(DailyLog)
        private dailyLogRepo: Repository<DailyLog>,
        @InjectRepository(DailyLogRequest)
        private requestRepo: Repository<DailyLogRequest>,
        @InjectRepository(DailyLogResponse)
        private responseRepo: Repository<DailyLogResponse>,
    ) { }

    // ═══════ DAILY LOG CRUD ═══════

    async findAll(workId?: string, page = 1, limit = 50) {
        const query = this.dailyLogRepo
            .createQueryBuilder('log')
            .leftJoinAndSelect('log.work', 'work')
            .leftJoinAndSelect('log.createdBy', 'createdBy')
            .where('log.deletedAt IS NULL')
            .orderBy('log.date', 'DESC');

        if (workId) {
            query.andWhere('log.workId = :workId', { workId });
        }

        const total = await query.getCount();
        const data = await query.skip((page - 1) * limit).take(limit).getMany();
        return { data, total, page, limit };
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

    // ═══════ REQUESTS (Solicitações) ═══════

    async findAllRequests(workId?: string, status?: string) {
        const query = this.requestRepo
            .createQueryBuilder('req')
            .leftJoinAndSelect('req.work', 'work')
            .leftJoinAndSelect('req.createdBy', 'createdBy')
            .leftJoinAndSelect('req.responses', 'responses')
            .leftJoinAndSelect('responses.createdBy', 'respCreator')
            .where('req.deletedAt IS NULL')
            .orderBy('req.requestDate', 'DESC')
            .addOrderBy('responses.responseDate', 'ASC');

        if (workId) query.andWhere('req.workId = :workId', { workId });
        if (status && status !== 'all') query.andWhere('req.status = :status', { status });

        return query.getMany();
    }

    async findOneRequest(id: string) {
        const req = await this.requestRepo.findOne({
            where: { id },
            relations: ['work', 'createdBy', 'responses', 'responses.createdBy'],
            order: { responses: { responseDate: 'ASC' } },
        });
        if (!req) throw new NotFoundException('Solicitação não encontrada');
        return req;
    }

    async createRequest(data: Partial<DailyLogRequest>) {
        const req = this.requestRepo.create(data);
        return this.requestRepo.save(req);
    }

    async updateRequest(id: string, data: Partial<DailyLogRequest>) {
        const req = await this.findOneRequest(id);
        // If resolving, calculate response time
        if (data.status === 'resolved' && !req.resolvedDate) {
            data.resolvedDate = new Date() as any;
            const requestDate = new Date(req.requestDate);
            const resolvedDate = new Date(data.resolvedDate);
            data.responseTimeDays = Math.ceil((resolvedDate.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
        }
        Object.assign(req, data);
        return this.requestRepo.save(req);
    }

    async deleteRequest(id: string) {
        const req = await this.requestRepo.findOneBy({ id });
        if (!req) throw new NotFoundException('Solicitação não encontrada');
        return this.requestRepo.softRemove(req);
    }

    // ═══════ RESPONSES (Respostas) ═══════

    async addResponse(requestId: string, data: Partial<DailyLogResponse>) {
        const req = await this.requestRepo.findOneBy({ id: requestId });
        if (!req) throw new NotFoundException('Solicitação não encontrada');

        const response = this.responseRepo.create({
            ...data,
            requestId,
        });
        const saved = await this.responseRepo.save(response);

        // Auto-update request status to 'answered' if still pending
        if (req.status === 'pending') {
            req.status = 'answered';
            await this.requestRepo.save(req);
        }

        return saved;
    }

    async deleteResponse(id: string) {
        const resp = await this.responseRepo.findOneBy({ id });
        if (!resp) throw new NotFoundException('Resposta não encontrada');
        return this.responseRepo.softRemove(resp);
    }

    // ═══════ REQUEST STATS ═══════

    async getRequestStats(workId?: string) {
        const where: any = {};
        if (workId) where.workId = workId;

        const requests = await this.requestRepo.find({ where });
        const pending = requests.filter(r => r.status === 'pending').length;
        const answered = requests.filter(r => r.status === 'answered').length;
        const resolved = requests.filter(r => r.status === 'resolved').length;
        const cancelled = requests.filter(r => r.status === 'cancelled').length;
        const urgent = requests.filter(r => r.priority === 'urgent' || r.priority === 'critical').filter(r => r.status === 'pending').length;
        const avgResponseDays = (() => {
            const withTime = requests.filter(r => r.responseTimeDays != null);
            return withTime.length > 0
                ? Math.round(withTime.reduce((s, r) => s + r.responseTimeDays, 0) / withTime.length)
                : 0;
        })();

        return { total: requests.length, pending, answered, resolved, cancelled, urgent, avgResponseDays };
    }
}
