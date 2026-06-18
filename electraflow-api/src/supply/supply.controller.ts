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
import {
    CreateSupplierDto,
    UpdateSupplierDto,
    CreateSupplierContactDto,
    UpdateSupplierContactDto,
    CreateQuotationDto,
    UpdateQuotationDto,
    CreateQuotationResponseDto,
    CreatePriceHistoryDto,
    CalculateMarkupDto,
    PriceComparisonDto,
} from './dto';

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
    createSupplier(@Body() data: CreateSupplierDto) {
        return this.supplyService.createSupplier(data);
    }

    @Put('suppliers/:id')
    updateSupplier(@Param('id') id: string, @Body() data: UpdateSupplierDto) {
        return this.supplyService.updateSupplier(id, data);
    }

    @Delete('suppliers/:id')
    deleteSupplier(@Param('id') id: string) {
        return this.supplyService.deleteSupplier(id);
    }

    // ==================== CONTACTS ====================

    @Post('suppliers/:id/contacts')
    addContact(@Param('id') supplierId: string, @Body() data: CreateSupplierContactDto) {
        return this.supplyService.addContact(supplierId, data);
    }

    @Put('contacts/:id')
    updateContact(@Param('id') id: string, @Body() data: UpdateSupplierContactDto) {
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
    createQuotation(@Body() data: CreateQuotationDto) {
        return this.supplyService.createQuotation(data as any);
    }

    @Put('quotations/:id')
    updateQuotation(@Param('id') id: string, @Body() data: UpdateQuotationDto) {
        return this.supplyService.updateQuotation(id, data as any);
    }

    // ==================== RESPONSES ====================

    @Post('quotations/:id/responses')
    addQuotationResponse(@Param('id') id: string, @Body() data: CreateQuotationResponseDto) {
        return this.supplyService.addQuotationResponse(id, data as any);
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
    addPriceManual(@Body() data: CreatePriceHistoryDto) {
        return this.supplyService.addPriceManual(data as any);
    }

    @Get('best-price/:catalogItemId')
    getBestPrice(@Param('catalogItemId') catalogItemId: string) {
        return this.supplyService.getBestPrice(catalogItemId);
    }

    // ==================== MARKUP & COMPARISON ====================

    @Post('markup-calculator')
    calculateMarkup(@Body() data: CalculateMarkupDto) {
        return this.supplyService.calculateMarkup(data);
    }

    @Post('price-comparison')
    priceComparison(@Body() data: PriceComparisonDto) {
        return this.supplyService.priceComparison(data.catalogItemIds);
    }
}
