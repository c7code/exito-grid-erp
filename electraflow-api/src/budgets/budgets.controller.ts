import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
    constructor(private readonly service: BudgetsService) {}

    @Get()
    findAll(@Req() req: any) {
        return this.service.findAll(req.user?.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Post()
    create(@Body() data: any, @Req() req: any) {
        return this.service.create({ ...data, userId: req.user?.id, companyId: req.user?.companyId });
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: any) {
        return this.service.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }

    // === Items ===

    @Post(':id/items')
    addItem(@Param('id') budgetId: string, @Body() data: any) {
        return this.service.addItem(budgetId, data);
    }

    @Put('items/:itemId')
    updateItem(@Param('itemId') itemId: string, @Body() data: any) {
        return this.service.updateItem(itemId, data);
    }

    @Delete('items/:itemId')
    removeItem(@Param('itemId') itemId: string) {
        return this.service.removeItem(itemId);
    }

    // === SINAPI Integration ===

    @Post(':id/sinapi/:code')
    addSinapiComposition(
        @Param('id') budgetId: string,
        @Param('code') compositionCode: string,
        @Query('state') state?: string,
    ) {
        return this.service.addSinapiComposition(budgetId, compositionCode, state);
    }
}
