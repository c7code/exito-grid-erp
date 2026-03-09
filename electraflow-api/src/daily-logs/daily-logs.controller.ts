import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { DailyLogsService } from './daily-logs.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('daily-logs')
@UseGuards(AuthGuard('jwt'))
export class DailyLogsController {
    constructor(private readonly service: DailyLogsService) { }

    @Get()
    findAll(@Query('workId') workId?: string) {
        return this.service.findAll(workId);
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
}
