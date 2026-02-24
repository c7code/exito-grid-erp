import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SupplyService } from './supply.service';

@Controller('supply')
@UseGuards(JwtAuthGuard)
export class SupplyController {
    constructor(private readonly supplyService: SupplyService) { }

    // ==================== SUPPLIERS ====================

    @Get('suppliers')
    findAllSuppliers(
        @Query('segment') segment?: string,
        @Query('status') status?: string,
    ) {
        return this.supplyService.findAllSuppliers({ segment, status });
    }

    @Get('suppliers/:id')
    findSupplier(@Param('id') id: string) {
        return this.supplyService.findSupplier(id);
    }

    @Post('suppliers')
    createSupplier(@Body() data: any) {
        return this.supplyService.createSupplier(data);
    }

    @Put('suppliers/:id')
    updateSupplier(@Param('id') id: string, @Body() data: any) {
        return this.supplyService.updateSupplier(id, data);
    }

    @Delete('suppliers/:id')
    deleteSupplier(@Param('id') id: string) {
        return this.supplyService.deleteSupplier(id);
    }

    // ==================== CONTACTS ====================

    @Post('suppliers/:id/contacts')
    addContact(@Param('id') supplierId: string, @Body() data: any) {
        return this.supplyService.addContact(supplierId, data);
    }

    @Put('contacts/:id')
    updateContact(@Param('id') id: string, @Body() data: any) {
        return this.supplyService.updateContact(id, data);
    }

    @Delete('contacts/:id')
    deleteContact(@Param('id') id: string) {
        return this.supplyService.deleteContact(id);
    }

    // ==================== QUOTATIONS ====================

    @Get('quotations')
    findAllQuotations(@Query('status') status?: string) {
        return this.supplyService.findAllQuotations(status);
    }

    @Get('quotations/:id')
    findQuotation(@Param('id') id: string) {
        return this.supplyService.findQuotation(id);
    }

    @Post('quotations')
    createQuotation(@Body() data: any) {
        return this.supplyService.createQuotation(data);
    }

    @Put('quotations/:id')
    updateQuotation(@Param('id') id: string, @Body() data: any) {
        return this.supplyService.updateQuotation(id, data);
    }

    // ==================== RESPONSES ====================

    @Post('quotations/:id/responses')
    addQuotationResponse(@Param('id') id: string, @Body() data: any) {
        return this.supplyService.addQuotationResponse(id, data);
    }

    @Post('responses/:id/select')
    selectResponse(@Param('id') id: string) {
        return this.supplyService.selectResponse(id);
    }

    // ==================== COMPARISON ====================

    @Get('quotations/:id/compare')
    compareQuotation(@Param('id') id: string) {
        return this.supplyService.compareQuotation(id);
    }

    // ==================== PRICE HISTORY ====================

    @Get('price-history/:catalogItemId')
    getPriceHistory(
        @Param('catalogItemId') catalogItemId: string,
        @Query('supplierId') supplierId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.supplyService.getPriceHistory(catalogItemId, { supplierId, startDate, endDate });
    }

    @Post('price-history')
    addPriceManual(@Body() data: any) {
        return this.supplyService.addPriceManual(data);
    }

    @Get('best-price/:catalogItemId')
    getBestPrice(@Param('catalogItemId') catalogItemId: string) {
        return this.supplyService.getBestPrice(catalogItemId);
    }

    // ==================== MARKUP & COMPARISON ====================

    @Post('markup-calculator')
    calculateMarkup(@Body() data: { catalogItemId: string; markupPercent: number; supplierId?: string }) {
        return this.supplyService.calculateMarkup(data);
    }

    @Post('price-comparison')
    priceComparison(@Body() data: { catalogItemIds: string[] }) {
        return this.supplyService.priceComparison(data.catalogItemIds);
    }
}
