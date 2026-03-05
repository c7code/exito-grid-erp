import { Controller, Get, Put, Param, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('Notificações')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
    constructor(private notificationsService: NotificationsService) { }

    @Get()
    @ApiOperation({ summary: 'Listar notificações do usuário logado' })
    async findAll(@Request() req) {
        return this.notificationsService.findByUser(req.user.userId);
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Contar notificações não lidas' })
    async unreadCount(@Request() req) {
        const count = await this.notificationsService.countUnread(req.user.userId);
        return { count };
    }

    @Put(':id/read')
    @ApiOperation({ summary: 'Marcar notificação como lida' })
    async markAsRead(@Param('id') id: string) {
        await this.notificationsService.markAsRead(id);
        return { message: 'Notificação marcada como lida' };
    }

    @Put('read-all')
    @ApiOperation({ summary: 'Marcar todas as notificações como lidas' })
    async markAllAsRead(@Request() req) {
        await this.notificationsService.markAllAsRead(req.user.userId);
        return { message: 'Todas as notificações marcadas como lidas' };
    }
}
