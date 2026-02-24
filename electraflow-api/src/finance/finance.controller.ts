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
}
