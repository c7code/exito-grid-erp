import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In, Not } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
import { Task, TaskStatus } from '../tasks/task.entity';
import { TaskResolver } from '../tasks/task-resolver.entity';
import { Employee } from '../employees/employee.entity';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class NotificationsService implements OnModuleInit {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        @InjectRepository(Notification)
        private notificationRepository: Repository<Notification>,
        @InjectRepository(Task)
        private taskRepository: Repository<Task>,
        @InjectRepository(TaskResolver)
        private resolverRepository: Repository<TaskResolver>,
        @InjectRepository(Employee)
        private employeeRepository: Repository<Employee>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    onModuleInit() {
        // Check for overdue tasks every 15 minutes
        setInterval(() => {
            this.checkOverdueTasks().catch(err =>
                this.logger.error('Erro ao verificar tarefas atrasadas', err),
            );
        }, 15 * 60 * 1000);

        // Run once on startup after a short delay
        setTimeout(() => {
            this.checkOverdueTasks().catch(err =>
                this.logger.error('Erro ao verificar tarefas atrasadas', err),
            );
        }, 30_000);
    }

    // ── Public API ──────────────────────────────────────────

    async findByUser(userId: string): Promise<Notification[]> {
        return this.notificationRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }

    async countUnread(userId: string): Promise<number> {
        return this.notificationRepository.count({
            where: { userId, isRead: false },
        });
    }

    async markAsRead(id: string): Promise<void> {
        await this.notificationRepository.update(id, { isRead: true });
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.notificationRepository.update(
            { userId, isRead: false },
            { isRead: true },
        );
    }

    // ── Event-driven creation ──────────────────────────────

    /**
     * Notify resolvers + admins about a new task.
     */
    async onTaskCreated(task: Task): Promise<void> {
        const recipientIds = await this.getRecipientUserIds(task.id, true);

        for (const userId of recipientIds) {
            await this.create({
                userId,
                type: NotificationType.NEW_TASK,
                title: 'Nova tarefa atribuída',
                message: `A tarefa "${task.title}" foi criada e atribuída a você.`,
                taskId: task.id,
            });
        }
    }

    /**
     * Notify admins when a task transitions to in_progress.
     */
    async onTaskStarted(task: Task): Promise<void> {
        const adminIds = await this.getAdminUserIds();

        for (const userId of adminIds) {
            await this.create({
                userId,
                type: NotificationType.TASK_STARTED,
                title: 'Tarefa iniciada',
                message: `A tarefa "${task.title}" foi iniciada.`,
                taskId: task.id,
            });
        }
    }

    /**
     * Notify admins when a task is completed.
     */
    async onTaskCompleted(task: Task): Promise<void> {
        const adminIds = await this.getAdminUserIds();

        for (const userId of adminIds) {
            await this.create({
                userId,
                type: NotificationType.TASK_COMPLETED,
                title: 'Tarefa concluída',
                message: `A tarefa "${task.title}" foi concluída.`,
                taskId: task.id,
            });
        }
    }

    // ── Overdue checker ────────────────────────────────────

    async checkOverdueTasks(): Promise<void> {
        const now = new Date();

        const overdueTasks = await this.taskRepository.find({
            where: {
                dueDate: LessThan(now),
                status: In([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
            },
        });

        for (const task of overdueTasks) {
            // Check if an overdue notification was already sent today for this task
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const existing = await this.notificationRepository
                .createQueryBuilder('n')
                .where('n.taskId = :taskId', { taskId: task.id })
                .andWhere('n.type = :type', { type: NotificationType.OVERDUE_TASK })
                .andWhere('n.createdAt >= :today', { today })
                .getCount();

            if (existing > 0) continue;

            const recipientIds = await this.getRecipientUserIds(task.id, true);

            for (const userId of recipientIds) {
                await this.create({
                    userId,
                    type: NotificationType.OVERDUE_TASK,
                    title: 'Tarefa atrasada',
                    message: `A tarefa "${task.title}" está atrasada.`,
                    taskId: task.id,
                });
            }
        }

        if (overdueTasks.length > 0) {
            this.logger.log(`Verificadas ${overdueTasks.length} tarefas atrasadas`);
        }
    }

    // ── Helpers ────────────────────────────────────────────

    private async create(data: Partial<Notification>): Promise<Notification> {
        const notification = this.notificationRepository.create(data);
        return this.notificationRepository.save(notification);
    }

    /**
     * Get user IDs for all resolvers of a task.
     * If includeAdmins is true, also includes all admin user IDs.
     */
    private async getRecipientUserIds(taskId: string, includeAdmins: boolean): Promise<string[]> {
        const userIds = new Set<string>();

        // Get resolver employees for this task
        const resolvers = await this.resolverRepository.find({
            where: { taskId },
            relations: ['employee'],
        });

        for (const resolver of resolvers) {
            if (resolver.employee?.email) {
                const user = await this.userRepository.findOneBy({ email: resolver.employee.email });
                if (user) userIds.add(user.id);
            }
        }

        if (includeAdmins) {
            const adminIds = await this.getAdminUserIds();
            adminIds.forEach(id => userIds.add(id));
        }

        return Array.from(userIds);
    }

    private async getAdminUserIds(): Promise<string[]> {
        const admins = await this.userRepository.find({
            where: { role: UserRole.ADMIN },
            select: ['id'],
        });
        return admins.map(a => a.id);
    }
}
