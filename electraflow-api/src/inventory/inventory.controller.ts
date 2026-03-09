import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('inventory')
@UseGuards(AuthGuard('jwt'))
export class InventoryController {
    constructor(private readonly service: InventoryService) { }

    // Items
    @Get('items')
    findAllItems(@Query('category') category?: string) {
        return this.service.findAllItems(category);
    }

    @Get('items/low-stock')
    getLowStockItems() {
        return this.service.getLowStockItems();
    }

    @Get('items/:id')
    findOneItem(@Param('id') id: string) {
        return this.service.findOneItem(id);
    }

    @Post('items')
    createItem(@Body() data: any) {
        return this.service.createItem(data);
    }

    @Put('items/:id')
    updateItem(@Param('id') id: string, @Body() data: any) {
        return this.service.updateItem(id, data);
    }

    @Delete('items/:id')
    removeItem(@Param('id') id: string) {
        return this.service.removeItem(id);
    }

    // Movements
    @Get('movements')
    findAllMovements(
        @Query('itemId') itemId?: string,
        @Query('workId') workId?: string,
        @Query('type') type?: string,
    ) {
        return this.service.findAllMovements({ itemId, workId, type });
    }

    @Post('movements')
    createMovement(@Body() data: any, @Req() req: any) {
        return this.service.createMovement({
            ...data,
            performedById: req.user?.id || req.user?.sub,
        });
    }

    // Summary
    @Get('summary')
    getSummary() {
        return this.service.getInventorySummary();
    }
}
