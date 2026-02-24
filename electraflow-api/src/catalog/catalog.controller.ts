import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogCategory, CatalogItem, CatalogType } from './catalog.entity';
import { StockMovementType } from './stock-movement.entity';

@Controller('catalog')
export class CatalogController {
    constructor(private readonly catalogService: CatalogService) { }

    // ═══════════════════════════════════════════════════════════════
    // CATEGORIAS
    // ═══════════════════════════════════════════════════════════════

    @Get('categories')
    findAllCategories(@Query('type') type?: CatalogType) {
        return this.catalogService.findAllCategories(type);
    }

    @Get('categories/tree')
    findCategoryTree(@Query('type') type?: CatalogType) {
        return this.catalogService.findCategoryTree(type);
    }

    @Post('categories')
    createCategory(@Body() data: Partial<CatalogCategory>) {
        return this.catalogService.createCategory(data);
    }

    @Put('categories/:id')
    updateCategory(@Param('id') id: string, @Body() data: Partial<CatalogCategory>) {
        return this.catalogService.updateCategory(id, data);
    }

    @Delete('categories/:id')
    removeCategory(@Param('id') id: string) {
        return this.catalogService.removeCategory(id);
    }

    // ═══════════════════════════════════════════════════════════════
    // ITENS / PRODUTOS
    // ═══════════════════════════════════════════════════════════════

    @Get('items')
    findAllItems(@Query('type') type?: CatalogType, @Query('categoryId') categoryId?: string) {
        return this.catalogService.findAllItems(type, categoryId);
    }

    @Get('items/:id')
    findOneItem(@Param('id') id: string) {
        return this.catalogService.findOneItem(id);
    }

    @Get('search')
    searchCatalog(@Query('q') query: string, @Query('type') type?: CatalogType) {
        return this.catalogService.searchCatalog(query, type);
    }

    @Get('categories/:id/items')
    getCategoryItems(@Param('id') id: string) {
        return this.catalogService.findItemsByCategory(id);
    }

    @Post('items')
    createItem(@Body() data: Partial<CatalogItem>) {
        return this.catalogService.createItem(data);
    }

    @Put('items/:id')
    updateItem(@Param('id') id: string, @Body() data: Partial<CatalogItem>) {
        return this.catalogService.updateItem(id, data);
    }

    @Delete('items/:id')
    removeItem(@Param('id') id: string) {
        return this.catalogService.removeItem(id);
    }

    // ═══════════════════════════════════════════════════════════════
    // NCM — Busca
    // ═══════════════════════════════════════════════════════════════

    @Get('ncm/search')
    searchNcm(@Query('q') query: string) {
        return this.catalogService.searchNcm(query);
    }

    @Get('ncm')
    findAllNcm() {
        return this.catalogService.findAllNcm();
    }

    @Get('ncm/public')
    searchNcmPublic(@Query('q') query: string) {
        return this.catalogService.searchNcmPublic(query);
    }

    // ═══════════════════════════════════════════════════════════════
    // CFOP — Lista estática
    // ═══════════════════════════════════════════════════════════════

    @Get('cfop')
    getCfopList(
        @Query('type') type?: string,
        @Query('scope') scope?: string,
        @Query('search') search?: string,
    ) {
        return this.catalogService.getCfopList({ type, scope, search });
    }

    // ═══════════════════════════════════════════════════════════════
    // CNPJ e CEP — Consulta pública
    // ═══════════════════════════════════════════════════════════════

    @Get('cnpj/:cnpj')
    lookupCnpj(@Param('cnpj') cnpj: string) {
        return this.catalogService.lookupCnpj(cnpj);
    }

    @Get('cep/:cep')
    lookupCep(@Param('cep') cep: string) {
        return this.catalogService.lookupCep(cep);
    }

    // ═══════════════════════════════════════════════════════════════
    // ESTOQUE — Resumo e Movimentações
    // ═══════════════════════════════════════════════════════════════

    @Get('stock/summary')
    getStockSummary() {
        return this.catalogService.getStockSummary();
    }

    @Post('stock/movements')
    createStockMovement(@Body() data: {
        catalogItemId: string;
        type: StockMovementType;
        quantity: number;
        reason?: string;
        referenceType?: string;
        referenceId?: string;
        createdBy?: string;
    }) {
        return this.catalogService.createStockMovement(data);
    }

    @Get('items/:id/stock-movements')
    getStockMovements(@Param('id') id: string, @Query('limit') limit?: string) {
        return this.catalogService.getStockMovements(id, limit ? parseInt(limit) : 50);
    }

    // ═══════════════════════════════════════════════════════════════
    // FORNECEDORES DO PRODUTO
    // ═══════════════════════════════════════════════════════════════

    @Get('items/:id/suppliers')
    getProductSuppliers(@Param('id') id: string) {
        return this.catalogService.getProductSuppliers(id);
    }

    @Post('items/:id/suppliers')
    linkSupplier(@Param('id') catalogItemId: string, @Body() data: any) {
        return this.catalogService.linkSupplier({ ...data, catalogItemId });
    }

    @Delete('items/:id/suppliers/:supplierId')
    unlinkSupplier(@Param('id') catalogItemId: string, @Param('supplierId') supplierId: string) {
        return this.catalogService.unlinkSupplier(catalogItemId, supplierId);
    }

    // ═══════════════════════════════════════════════════════════════
    // REGRAS FISCAIS
    // ═══════════════════════════════════════════════════════════════

    @Get('fiscal-rules')
    findAllFiscalRules() {
        return this.catalogService.findAllFiscalRules();
    }

    @Post('fiscal-rules')
    createFiscalRule(@Body() data: any) {
        return this.catalogService.createFiscalRule(data);
    }

    @Put('fiscal-rules/:id')
    updateFiscalRule(@Param('id') id: string, @Body() data: any) {
        return this.catalogService.updateFiscalRule(id, data);
    }

    @Delete('fiscal-rules/:id')
    removeFiscalRule(@Param('id') id: string) {
        return this.catalogService.removeFiscalRule(id);
    }
}
