import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ServiceOrdersService } from './service-orders.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('service-orders')
@UseGuards(AuthGuard('jwt'))
export class ServiceOrdersController {
    constructor(private readonly service: ServiceOrdersService) { }

    @Get()
    findAll(
        @Query('status') status?: string,
        @Query('workId') workId?: string,
        @Query('assignedToId') assignedToId?: string,
    ) {
        return this.service.findAll({ status, workId, assignedToId });
    }

    @Get('stats')
    getStats() {
        return this.service.getStats();
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
    clientSign(@Param('id') id: string, @Body() data: { signature: string; name: string }) {
        return this.service.clientSign(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
