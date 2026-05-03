import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinanceConfigService } from './finance-config.service';

@ApiTags('Finance Config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance/config')
export class FinanceConfigController {
  constructor(private readonly svc: FinanceConfigService) {}

  // ═══ DRE CATEGORIES ══════════════════════════════════════════
  @Get('dre-categories')
  @ApiOperation({ summary: 'Listar categorias DRE' })
  getDreCategories() { return this.svc.getDreCategories(); }

  @Get('dre-categories/tree')
  @ApiOperation({ summary: 'Categorias DRE em árvore' })
  getDreCategoriesTree() { return this.svc.getDreCategoriesTree(); }

  @Post('dre-categories')
  @ApiOperation({ summary: 'Criar categoria DRE' })
  createDreCategory(@Body() data: any) { return this.svc.createDreCategory(data); }

  @Put('dre-categories/:id')
  @ApiOperation({ summary: 'Atualizar categoria DRE' })
  updateDreCategory(@Param('id') id: string, @Body() data: any) { return this.svc.updateDreCategory(id, data); }

  @Delete('dre-categories/:id')
  @ApiOperation({ summary: 'Remover categoria DRE' })
  deleteDreCategory(@Param('id') id: string) { return this.svc.deleteDreCategory(id); }

  @Post('dre-categories/seed')
  @ApiOperation({ summary: 'Seed categorias DRE padrão' })
  seedDreCategories() { return this.svc.seedDefaultDreCategories(); }

  // ═══ BANK ACCOUNTS ═══════════════════════════════════════════
  @Get('bank-accounts')
  getBankAccounts() { return this.svc.getBankAccounts(); }

  @Post('bank-accounts')
  createBankAccount(@Body() data: any) { return this.svc.createBankAccount(data); }

  @Put('bank-accounts/:id')
  updateBankAccount(@Param('id') id: string, @Body() data: any) { return this.svc.updateBankAccount(id, data); }

  @Delete('bank-accounts/:id')
  deleteBankAccount(@Param('id') id: string) { return this.svc.deleteBankAccount(id); }

  // ═══ COST CENTERS ════════════════════════════════════════════
  @Get('cost-centers')
  getCostCenters() { return this.svc.getCostCenters(); }

  @Post('cost-centers')
  createCostCenter(@Body() data: any) { return this.svc.createCostCenter(data); }

  @Put('cost-centers/:id')
  updateCostCenter(@Param('id') id: string, @Body() data: any) { return this.svc.updateCostCenter(id, data); }

  @Delete('cost-centers/:id')
  deleteCostCenter(@Param('id') id: string) { return this.svc.deleteCostCenter(id); }

  // ═══ CHART OF ACCOUNTS ══════════════════════════════════════
  @Get('chart-of-accounts')
  getChartOfAccounts() { return this.svc.getChartOfAccounts(); }

  @Post('chart-of-accounts')
  createChartAccount(@Body() data: any) { return this.svc.createChartAccount(data); }

  @Put('chart-of-accounts/:id')
  updateChartAccount(@Param('id') id: string, @Body() data: any) { return this.svc.updateChartAccount(id, data); }

  @Delete('chart-of-accounts/:id')
  deleteChartAccount(@Param('id') id: string) { return this.svc.deleteChartAccount(id); }

  // ═══ CASH REGISTERS ═════════════════════════════════════════
  @Get('cash-registers')
  getCashRegisters() { return this.svc.getCashRegisters(); }

  @Post('cash-registers')
  createCashRegister(@Body() data: any) { return this.svc.createCashRegister(data); }

  @Put('cash-registers/:id')
  updateCashRegister(@Param('id') id: string, @Body() data: any) { return this.svc.updateCashRegister(id, data); }

  @Delete('cash-registers/:id')
  deleteCashRegister(@Param('id') id: string) { return this.svc.deleteCashRegister(id); }

  // ═══ PAYMENT METHODS ════════════════════════════════════════
  @Get('payment-methods')
  getPaymentMethods() { return this.svc.getPaymentMethods(); }

  @Post('payment-methods')
  createPaymentMethod(@Body() data: any) { return this.svc.createPaymentMethod(data); }

  @Put('payment-methods/:id')
  updatePaymentMethod(@Param('id') id: string, @Body() data: any) { return this.svc.updatePaymentMethod(id, data); }

  @Delete('payment-methods/:id')
  deletePaymentMethod(@Param('id') id: string) { return this.svc.deletePaymentMethod(id); }
}
