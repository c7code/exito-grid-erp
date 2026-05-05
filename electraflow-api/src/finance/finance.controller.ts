import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards,
  UseInterceptors, UploadedFile, Res, NotFoundException, Delete,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync } from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinanceService } from './finance.service';
import { Payment, PaymentStatus } from './payment.entity';
import { WorkCost } from './work-cost.entity';
import { PaymentSchedule } from './payment-schedule.entity';

const invoiceStorage = diskStorage({
  destination: './uploads/invoices',
  filename: (_, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `invoice-${unique}${extname(file.originalname)}`);
  },
});

const receiptStorage = diskStorage({
  destination: './uploads/receipts',
  filename: (_, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `receipt-${unique}${extname(file.originalname)}`);
  },
});

@ApiTags('Financeiro')
@Controller('finance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FinanceController {
  constructor(private financeService: FinanceService) { }

  @Get('payments')
  @ApiOperation({ summary: 'Listar pagamentos' })
  async findAll(@Query('status') status?: PaymentStatus, @Query('workId') workId?: string) {
    return this.financeService.findAll(status, workId);
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Buscar pagamento por ID' })
  async findOne(@Param('id') id: string) {
    return this.financeService.findOne(id);
  }

  @Post('payments')
  @ApiOperation({ summary: 'Criar pagamento' })
  async create(@Body() paymentData: Partial<Payment>) {
    return this.financeService.create(paymentData);
  }

  // ═══ Static POST routes (must be before :id) ═══

  @Post('payments/from-proposal')
  @ApiOperation({ summary: 'Criar lançamento financeiro a partir de uma proposta' })
  async createFromProposal(@Body() data: any) {
    return this.financeService.createPaymentFromProposal(data);
  }

  @Post('payments/from-work')
  @ApiOperation({ summary: 'Criar lançamento financeiro a partir de uma obra' })
  async createFromWork(@Body() data: any) {
    return this.financeService.createPaymentFromWork(data);
  }

  @Get('payments/check-proposal/:proposalId')
  @ApiOperation({ summary: 'Verificar se já existe lançamento para a proposta' })
  async checkProposalPayment(@Param('proposalId') proposalId: string) {
    return this.financeService.checkProposalPayment(proposalId);
  }

  @Put('payments/:id')
  @ApiOperation({ summary: 'Atualizar pagamento' })
  async update(@Param('id') id: string, @Body() paymentData: Partial<Payment>) {
    return this.financeService.update(id, paymentData);
  }

  @Delete('payments/:id')
  @ApiOperation({ summary: 'Remover pagamento' })
  async remove(@Param('id') id: string) {
    return this.financeService.remove(id);
  }

  @Post('payments/:id/register')
  @ApiOperation({ summary: 'Registrar pagamento (baixa)' })
  async registerPayment(
    @Param('id') id: string,
    @Body() data: { amount: number; method: string; transactionId?: string },
  ) {
    return this.financeService.registerPayment(id, data.amount, data.method, data.transactionId);
  }

  @Post('payments/:id/invoice')
  @ApiOperation({ summary: 'Upload da Nota Fiscal' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: invoiceStorage }))
  async uploadInvoice(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.financeService.attachInvoice(id, file.filename, file.originalname);
  }

  @Get('payments/:id/invoice')
  @ApiOperation({ summary: 'Download da Nota Fiscal' })
  async downloadInvoice(@Param('id') id: string, @Res() res: Response) {
    const payment = await this.financeService.findOne(id);
    if (!payment.invoiceFile) {
      throw new NotFoundException('Nenhuma nota fiscal anexada');
    }
    const filePath = join(process.cwd(), 'uploads', 'invoices', payment.invoiceFile);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Arquivo não encontrado no servidor');
    }
    res.download(filePath, payment.invoiceFileName || payment.invoiceFile);
  }

  // ─── Relatórios ──────────────────────────────────────────────────────────

  @Get('summary')
  @ApiOperation({ summary: 'Resumo financeiro' })
  async getSummary() {
    return this.financeService.getSummary();
  }

  @Get('dre')
  @ApiOperation({ summary: 'Relatório DRE' })
  async getDREReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financeService.getDREReport(new Date(startDate), new Date(endDate));
  }

  @Get('summary-extended')
  @ApiOperation({ summary: 'Resumo financeiro estendido com comparação de período' })
  async getSummaryExtended(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financeService.getSummaryExtended(new Date(startDate), new Date(endDate));
  }

  @Get('monthly-evolution')
  @ApiOperation({ summary: 'Evolução mensal de receitas/despesas' })
  async getMonthlyEvolution(@Query('months') months?: string) {
    return this.financeService.getMonthlyEvolution(months ? parseInt(months) : 6);
  }

  // ═══ WORK COSTS ══════════════════════════════════════════════════════════

  @Get('work-costs')
  @ApiOperation({ summary: 'Listar custos por obra' })
  async findAllWorkCosts(@Query('workId') workId?: string) {
    return this.financeService.findAllWorkCosts(workId);
  }

  @Get('work-costs/:id')
  @ApiOperation({ summary: 'Buscar custo por ID' })
  async findOneWorkCost(@Param('id') id: string) {
    return this.financeService.findOneWorkCost(id);
  }

  @Post('work-costs')
  @ApiOperation({ summary: 'Registrar custo na obra' })
  async createWorkCost(@Body() data: Partial<WorkCost>) {
    return this.financeService.createWorkCost(data);
  }

  @Put('work-costs/:id')
  @ApiOperation({ summary: 'Atualizar custo' })
  async updateWorkCost(@Param('id') id: string, @Body() data: Partial<WorkCost>) {
    return this.financeService.updateWorkCost(id, data);
  }

  @Delete('work-costs/:id')
  @ApiOperation({ summary: 'Remover custo' })
  async removeWorkCost(@Param('id') id: string) {
    return this.financeService.removeWorkCost(id);
  }

  // ═══ PAYMENT SCHEDULES ═══════════════════════════════════════════════════

  @Get('payment-schedules')
  @ApiOperation({ summary: 'Listar programação de pagamentos' })
  async findAllPaymentSchedules(@Query('workId') workId?: string) {
    return this.financeService.findAllPaymentSchedules(workId);
  }

  @Get('payment-schedules/:id')
  @ApiOperation({ summary: 'Buscar programação por ID' })
  async findOnePaymentSchedule(@Param('id') id: string) {
    return this.financeService.findOnePaymentSchedule(id);
  }

  @Post('payment-schedules')
  @ApiOperation({ summary: 'Criar programação de pagamento' })
  async createPaymentSchedule(@Body() data: Partial<PaymentSchedule>) {
    return this.financeService.createPaymentSchedule(data);
  }

  @Put('payment-schedules/:id')
  @ApiOperation({ summary: 'Atualizar programação' })
  async updatePaymentSchedule(@Param('id') id: string, @Body() data: Partial<PaymentSchedule>) {
    return this.financeService.updatePaymentSchedule(id, data);
  }

  @Delete('payment-schedules/:id')
  @ApiOperation({ summary: 'Remover programação' })
  async removePaymentSchedule(@Param('id') id: string) {
    return this.financeService.removePaymentSchedule(id);
  }

  // ═══ PAYMENT RECEIPTS (RECIBOS) ═══════════════════════════════════════

  @Get('receipts')
  @ApiOperation({ summary: 'Listar recibos de pagamento' })
  async findAllReceipts(@Query('proposalId') proposalId?: string) {
    return this.financeService.findAllReceipts(proposalId);
  }

  @Get('receipts/:id')
  @ApiOperation({ summary: 'Buscar recibo por ID' })
  async findOneReceipt(@Param('id') id: string) {
    return this.financeService.findOneReceipt(id);
  }

  @Post('receipts')
  @ApiOperation({ summary: 'Criar recibo de pagamento' })
  async createReceipt(@Body() data: any) {
    return this.financeService.createReceipt(data);
  }

  @Put('receipts/:id')
  @ApiOperation({ summary: 'Atualizar recibo' })
  async updateReceipt(@Param('id') id: string, @Body() data: any) {
    return this.financeService.updateReceipt(id, data);
  }

  @Delete('receipts/:id')
  @ApiOperation({ summary: 'Remover recibo' })
  async removeReceipt(@Param('id') id: string) {
    return this.financeService.removeReceipt(id);
  }

  // ═══ PURCHASE ORDERS (PEDIDOS DE COMPRA) ═══════════════════════════════

  @Get('purchase-orders')
  @ApiOperation({ summary: 'Listar pedidos de compra' })
  async findAllPurchaseOrders(@Query('proposalId') proposalId?: string, @Query('supplierId') supplierId?: string) {
    return this.financeService.findAllPurchaseOrders(proposalId, supplierId);
  }

  @Get('purchase-orders/:id')
  @ApiOperation({ summary: 'Buscar pedido de compra por ID' })
  async findOnePurchaseOrder(@Param('id') id: string) {
    return this.financeService.findOnePurchaseOrder(id);
  }

  @Post('purchase-orders')
  @ApiOperation({ summary: 'Criar pedido de compra' })
  async createPurchaseOrder(@Body() data: any) {
    return this.financeService.createPurchaseOrder(data);
  }

  @Put('purchase-orders/:id')
  @ApiOperation({ summary: 'Atualizar pedido de compra' })
  async updatePurchaseOrder(@Param('id') id: string, @Body() data: any) {
    return this.financeService.updatePurchaseOrder(id, data);
  }

  @Delete('purchase-orders/:id')
  @ApiOperation({ summary: 'Remover pedido de compra' })
  async removePurchaseOrder(@Param('id') id: string) {
    return this.financeService.removePurchaseOrder(id);
  }

  // ═══ PAYMENT INSTALLMENTS (PARCELAS) ═══════════════════════════════════

  @Get('payments/:id/installments')
  @ApiOperation({ summary: 'Listar parcelas de um pagamento' })
  async getInstallments(@Param('id') paymentId: string) {
    return this.financeService.getInstallments(paymentId);
  }

  @Post('payments/:id/installments')
  @ApiOperation({ summary: 'Gerar parcelas para um pagamento' })
  async generateInstallments(
    @Param('id') paymentId: string,
    @Body() data: { installments: Array<{ percentage: number; dueDate: string; description?: string }> },
  ) {
    return this.financeService.generateInstallments(paymentId, data.installments);
  }

  @Post('installments/:id/pay')
  @ApiOperation({ summary: 'Dar baixa em uma parcela' })
  async payInstallment(
    @Param('id') installmentId: string,
    @Body() data: { amount: number; method: string; transactionId?: string },
  ) {
    return this.financeService.payInstallment(installmentId, data.amount, data.method, data.transactionId);
  }

  @Delete('installments/:id')
  @ApiOperation({ summary: 'Cancelar parcela' })
  async cancelInstallment(@Param('id') installmentId: string) {
    await this.financeService.cancelInstallment(installmentId);
    return { message: 'Parcela cancelada' };
  }

  @Post('installments/:id/receipt')
  @ApiOperation({ summary: 'Upload comprovante de pagamento da parcela' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: receiptStorage }))
  async uploadInstallmentReceipt(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.financeService.attachInstallmentReceipt(id, file.filename, file.originalname);
  }

  @Get('installments/:id/receipt')
  @ApiOperation({ summary: 'Download comprovante da parcela' })
  async downloadInstallmentReceipt(@Param('id') id: string, @Res() res: Response) {
    const inst = await this.financeService.getInstallmentById(id);
    if (!inst?.receiptFile) throw new NotFoundException('Comprovante não encontrado');
    const filePath = join(process.cwd(), 'uploads', 'receipts', inst.receiptFile);
    if (!existsSync(filePath)) throw new NotFoundException('Arquivo não encontrado no servidor');
    res.download(filePath, inst.receiptFileName || inst.receiptFile);
  }
}
