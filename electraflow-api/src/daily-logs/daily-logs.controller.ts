import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { DailyLogsService } from './daily-logs.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('daily-logs')
@UseGuards(AuthGuard('jwt'))
export class DailyLogsController {
    constructor(private readonly service: DailyLogsService) { }

    // ═══════ DAILY LOG CRUD ═══════

    @Get()
    findAll(@Query('workId') workId?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
        return this.service.findAll(workId, page ? parseInt(page) : 1, limit ? parseInt(limit) : 50);
    }

    @Get('stats/:workId')
    getStats(@Param('workId') workId: string) {
        return this.service.getStatsByWork(workId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Post()
    create(@Body() data: any, @Req() req: any) {
        return this.service.create({
            ...data,
            createdById: req.user?.id || req.user?.sub,
        });
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: any) {
        return this.service.update(id, data);
    }

    @Post(':id/sign')
    sign(@Param('id') id: string, @Body('signedBy') signedBy: string) {
        return this.service.sign(id, signedBy);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }

    // ═══════ REQUESTS (Solicitações) ═══════

    @Get('requests/all')
    findAllRequests(@Query('workId') workId?: string, @Query('status') status?: string) {
        return this.service.findAllRequests(workId, status);
    }

    @Get('requests/stats')
    getRequestStats(@Query('workId') workId?: string) {
        return this.service.getRequestStats(workId);
    }

    @Get('requests/:id')
    findOneRequest(@Param('id') id: string) {
        return this.service.findOneRequest(id);
    }

    @Post('requests')
    createRequest(@Body() data: any, @Req() req: any) {
        return this.service.createRequest({
            ...data,
            createdById: req.user?.id || req.user?.sub,
        });
    }

    @Patch('requests/:id')
    updateRequest(@Param('id') id: string, @Body() data: any) {
        return this.service.updateRequest(id, data);
    }

    @Delete('requests/:id')
    deleteRequest(@Param('id') id: string) {
        return this.service.deleteRequest(id);
    }

    // ═══════ RESPONSES ═══════

    @Post('requests/:id/responses')
    addResponse(@Param('id') requestId: string, @Body() data: any, @Req() req: any) {
        return this.service.addResponse(requestId, {
            ...data,
            createdById: req.user?.id || req.user?.sub,
        });
    }

    @Delete('responses/:id')
    deleteResponse(@Param('id') id: string) {
        return this.service.deleteResponse(id);
    }
}
