import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsUUID,
  IsArray, ValidateNested, IsInt, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentType, PaymentStatus, PaymentMethod, TransactionCategory } from './payment.entity';
import { WorkCostCategory, WorkCostStatus } from './work-cost.entity';
import { ScheduleStatus } from './payment-schedule.entity';
import { DebtType, DebtStatus, DebtNature } from './debt.entity';
import { StatementStatus } from './bank-statement.entity';

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENT
// ═══════════════════════════════════════════════════════════════════════════════

export class CreatePaymentDto {
  @ApiProperty({ description: 'Descrição do pagamento' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Valor do pagamento', example: 1500.00 })
  @IsNumber()
  @Type(() => Number)
  amount: number;

  @ApiProperty({ enum: PaymentType, description: 'Tipo: income ou expense' })
  @IsEnum(PaymentType)
  type: PaymentType;

  @ApiPropertyOptional({ enum: TransactionCategory, description: 'Categoria da transação' })
  @IsOptional()
  @IsEnum(TransactionCategory)
  category?: TransactionCategory;

  @ApiPropertyOptional({ description: 'ID do cliente', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'ID da obra', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  workId?: string;

  @ApiPropertyOptional({ description: 'ID da proposta', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  proposalId?: string;

  @ApiPropertyOptional({ description: 'Data de vencimento', example: '2025-12-31' })
  @IsOptional()
  @Type(() => Date)
  dueDate?: Date;

  @ApiPropertyOptional({ enum: PaymentMethod, description: 'Método de pagamento' })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ enum: PaymentStatus, description: 'Status do pagamento' })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'ID do fornecedor', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'ID do funcionário', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'ID da medição', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  measurementId?: string;

  @ApiPropertyOptional({ description: 'Número da nota fiscal' })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional({ description: 'Data de faturamento' })
  @IsOptional()
  @Type(() => Date)
  billingDate?: Date;

  @ApiPropertyOptional({ description: 'Data agendada de pagamento' })
  @IsOptional()
  @Type(() => Date)
  scheduledPaymentDate?: Date;

  @ApiPropertyOptional({ description: 'Percentual de retenção (%)', example: 5.0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  taxWithholding?: number;

  @ApiPropertyOptional({ description: 'Valor da retenção (R$)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  taxWithholdingAmount?: number;

  @ApiPropertyOptional({ description: 'Percentual de retenção (alias)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  retentionPercentage?: number;

  @ApiPropertyOptional({ description: 'Alíquota ISS (%)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  taxISS?: number;

  @ApiPropertyOptional({ description: 'Valor ISS (R$)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  taxISSAmount?: number;

  @ApiPropertyOptional({ description: 'Alíquota CSLL (%)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  taxCSLL?: number;

  @ApiPropertyOptional({ description: 'Valor CSLL (R$)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  taxCSLLAmount?: number;

  @ApiPropertyOptional({ description: 'Alíquota PIS/COFINS (%)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  taxPISCOFINS?: number;

  @ApiPropertyOptional({ description: 'Valor PIS/COFINS (R$)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  taxPISCOFINSAmount?: number;

  @ApiPropertyOptional({ description: 'Alíquota IRRF (%)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  taxIRRF?: number;

  @ApiPropertyOptional({ description: 'Valor IRRF (R$)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  taxIRRFAmount?: number;

  @ApiPropertyOptional({ description: 'Alíquota ICMS (%)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  taxICMS?: number;

  @ApiPropertyOptional({ description: 'Valor ICMS (R$)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  taxICMSAmount?: number;

  @ApiPropertyOptional({ description: 'Observação sobre impostos' })
  @IsOptional()
  @IsString()
  taxObservation?: string;

  @ApiPropertyOptional({ description: 'Custo tributário total (R$)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  taxCost?: number;

  @ApiPropertyOptional({ description: 'Base de cálculo INSS (%)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  inssBasePercentage?: number;

  @ApiPropertyOptional({ description: 'Alíquota INSS (%)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  inssRate?: number;

  @ApiPropertyOptional({ description: 'Valor retido INSS (R$)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  inssAmount?: number;

  @ApiPropertyOptional({ description: 'Nº GPS INSS' })
  @IsOptional()
  @IsString()
  inssGpsNumber?: string;

  @ApiPropertyOptional({ description: 'Alíquota Simples Nacional (%)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  simplesRate?: number;

  @ApiPropertyOptional({ description: 'Valor DAS (R$)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  simplesAmount?: number;

  @ApiPropertyOptional({ description: 'Status DAS: none | provisioned | realized' })
  @IsOptional()
  @IsString()
  simplesStatus?: string;

  @ApiPropertyOptional({ description: 'Competência DAS (YYYY-MM)' })
  @IsOptional()
  @IsString()
  simplesCompetence?: string;

  @ApiPropertyOptional({ description: 'Centro de custo' })
  @IsOptional()
  @IsString()
  costCenter?: string;

  @ApiPropertyOptional({ description: 'Origem financeira' })
  @IsOptional()
  @IsString()
  financialOrigin?: string;

  @ApiPropertyOptional({ description: 'Itens de rateio', type: 'array' })
  @IsOptional()
  @IsArray()
  apportionmentItems?: Array<{ description: string; percentage: number; amount: number }>;

  @ApiPropertyOptional({ description: 'URL do boleto' })
  @IsOptional()
  @IsString()
  boletoUrl?: string;

  @ApiPropertyOptional({ description: 'Nome do arquivo de boleto' })
  @IsOptional()
  @IsString()
  boletoFileName?: string;

  @ApiPropertyOptional({ description: 'Código PIX copia e cola' })
  @IsOptional()
  @IsString()
  pixQrCode?: string;

  @ApiPropertyOptional({ description: 'QR Code PIX base64' })
  @IsOptional()
  @IsString()
  pixQrCodeImage?: string;
}

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {}

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTER PAYMENT (BAIXA)
// ═══════════════════════════════════════════════════════════════════════════════

export class RegisterPaymentDto {
  @ApiProperty({ description: 'Valor do pagamento', example: 1500.00 })
  @IsNumber()
  @Type(() => Number)
  amount: number;

  @ApiProperty({ description: 'Método de pagamento', example: 'pix' })
  @IsString()
  @IsNotEmpty()
  method: string;

  @ApiPropertyOptional({ description: 'ID da transação' })
  @IsOptional()
  @IsString()
  transactionId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSOLIDATE DAS
// ═══════════════════════════════════════════════════════════════════════════════

export class ConsolidateDASDto {
  @ApiProperty({ description: 'IDs dos pagamentos a consolidar', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  paymentIds: string[];

  @ApiProperty({ description: 'Valor da guia DAS', example: 850.00 })
  @IsNumber()
  @Type(() => Number)
  dasAmount: number;

  @ApiProperty({ description: 'Mês de competência (YYYY-MM)', example: '2025-06' })
  @IsString()
  @IsNotEmpty()
  competence: string;

  @ApiPropertyOptional({ description: 'Status: provisioned | realized', default: 'realized' })
  @IsOptional()
  @IsString()
  status?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORK COSTS
// ═══════════════════════════════════════════════════════════════════════════════

export class CreateWorkCostDto {
  @ApiProperty({ description: 'ID da obra', format: 'uuid' })
  @IsUUID()
  workId: string;

  @ApiProperty({ description: 'Descrição do custo' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ enum: WorkCostCategory, description: 'Categoria do custo' })
  @IsOptional()
  @IsEnum(WorkCostCategory)
  category?: WorkCostCategory;

  @ApiProperty({ description: 'Valor total', example: 500.00 })
  @IsNumber()
  @Type(() => Number)
  totalPrice: number;

  @ApiPropertyOptional({ description: 'Quantidade', example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Unidade', example: 'un' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Preço unitário' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  unitPrice?: number;

  @ApiPropertyOptional({ description: 'Data do custo' })
  @IsOptional()
  @Type(() => Date)
  date?: Date;

  @ApiPropertyOptional({ description: 'Número da nota fiscal' })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional({ enum: WorkCostStatus, description: 'Status do custo' })
  @IsOptional()
  @IsEnum(WorkCostStatus)
  status?: WorkCostStatus;

  @ApiPropertyOptional({ description: 'ID do fornecedor', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'ID do funcionário', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateWorkCostDto extends PartialType(CreateWorkCostDto) {}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENT SCHEDULES
// ═══════════════════════════════════════════════════════════════════════════════

export class CreatePaymentScheduleDto {
  @ApiProperty({ description: 'ID da obra', format: 'uuid' })
  @IsUUID()
  workId: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Valor', example: 5000.00 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  amount?: number;

  @ApiPropertyOptional({ description: 'Data de vencimento' })
  @IsOptional()
  @Type(() => Date)
  dueDate?: Date;

  @ApiPropertyOptional({ description: 'Número da parcela' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  installmentNumber?: number;

  @ApiPropertyOptional({ description: 'Total de parcelas' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  totalInstallments?: number;

  @ApiPropertyOptional({ enum: ScheduleStatus, description: 'Status' })
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;

  @ApiPropertyOptional({ description: 'ID do fornecedor', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'ID do funcionário', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePaymentScheduleDto extends PartialType(CreatePaymentScheduleDto) {}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENT RECEIPTS (RECIBOS)
// ═══════════════════════════════════════════════════════════════════════════════

export class CreateReceiptDto {
  @ApiPropertyOptional({ description: 'ID da proposta', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  proposalId?: string;

  @ApiPropertyOptional({ description: 'ID do cliente', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiProperty({ description: 'Descrição do recibo' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Valor do recibo', example: 1000.00 })
  @IsNumber()
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({ description: 'Valor total da proposta' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalProposalValue?: number;

  @ApiPropertyOptional({ description: 'Percentual do recibo (%)', example: 50 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  percentage?: number;

  @ApiPropertyOptional({ description: 'Método de pagamento' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Data do pagamento' })
  @IsOptional()
  @Type(() => Date)
  paidAt?: Date;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Status: draft | issued | cancelled' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Número da proposta' })
  @IsOptional()
  @IsString()
  proposalNumber?: string;
}

export class UpdateReceiptDto extends PartialType(CreateReceiptDto) {}

// ═══════════════════════════════════════════════════════════════════════════════
// PURCHASE ORDERS (PEDIDOS DE COMPRA)
// ═══════════════════════════════════════════════════════════════════════════════

export class PurchaseOrderItemDto {
  @ApiProperty({ description: 'Descrição do item' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Quantidade', example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Unidade', example: 'un' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Preço unitário' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  unitPrice?: number;

  @ApiPropertyOptional({ description: 'Preço total do item' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalPrice?: number;

  @ApiPropertyOptional({ description: 'Custo interno (visível apenas para empresa)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  internalCost?: number;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePurchaseOrderDto {
  @ApiPropertyOptional({ description: 'ID do fornecedor', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'ID do cliente', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'ID da proposta', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  proposalId?: string;

  @ApiPropertyOptional({ description: 'Tipo: company_billing | direct_billing', default: 'company_billing' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Status: draft | sent | confirmed | delivered | cancelled', default: 'draft' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Valor total' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalValue?: number;

  @ApiPropertyOptional({ description: 'Condições de pagamento' })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiPropertyOptional({ description: 'Observações internas' })
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiPropertyOptional({ description: 'Margem interna (%)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  internalMargin?: number;

  @ApiPropertyOptional({ description: 'Data de entrega' })
  @IsOptional()
  @Type(() => Date)
  deliveryDate?: Date;

  @ApiPropertyOptional({ description: 'Endereço de entrega' })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Número da proposta' })
  @IsOptional()
  @IsString()
  proposalNumber?: string;

  @ApiPropertyOptional({ description: 'Número do contrato' })
  @IsOptional()
  @IsString()
  contractNumber?: string;

  @ApiPropertyOptional({ description: 'Nome da obra' })
  @IsOptional()
  @IsString()
  workName?: string;

  @ApiProperty({ description: 'Itens do pedido de compra', type: [PurchaseOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];
}

export class UpdatePurchaseOrderDto extends PartialType(CreatePurchaseOrderDto) {}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENT INSTALLMENTS (PARCELAS)
// ═══════════════════════════════════════════════════════════════════════════════

export class InstallmentItemDto {
  @ApiProperty({ description: 'Percentual da parcela (%)', example: 50 })
  @IsNumber()
  @Type(() => Number)
  percentage: number;

  @ApiProperty({ description: 'Data de vencimento', example: '2025-12-15' })
  @IsString()
  @IsNotEmpty()
  dueDate: string;

  @ApiPropertyOptional({ description: 'Descrição da parcela' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class GenerateInstallmentsDto {
  @ApiProperty({ description: 'Array de parcelas', type: [InstallmentItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InstallmentItemDto)
  installments: InstallmentItemDto[];
}

export class PayInstallmentDto {
  @ApiProperty({ description: 'Valor do pagamento', example: 750.00 })
  @IsNumber()
  @Type(() => Number)
  amount: number;

  @ApiProperty({ description: 'Método de pagamento', example: 'pix' })
  @IsString()
  @IsNotEmpty()
  method: string;

  @ApiPropertyOptional({ description: 'ID da transação' })
  @IsOptional()
  @IsString()
  transactionId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEBTS (DÍVIDAS)
// ═══════════════════════════════════════════════════════════════════════════════

export class CreateDebtDto {
  @ApiProperty({ description: 'Descrição da dívida' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Credor (banco, pessoa, empresa)' })
  @IsOptional()
  @IsString()
  creditor?: string;

  @ApiPropertyOptional({ enum: DebtType, description: 'Tipo da dívida' })
  @IsOptional()
  @IsEnum(DebtType)
  type?: DebtType;

  @ApiPropertyOptional({ enum: DebtNature, description: 'Natureza: good | bad | neutral' })
  @IsOptional()
  @IsEnum(DebtNature)
  nature?: DebtNature;

  @ApiPropertyOptional({ enum: DebtStatus, description: 'Status da dívida' })
  @IsOptional()
  @IsEnum(DebtStatus)
  status?: DebtStatus;

  @ApiProperty({ description: 'Valor original contratado', example: 50000 })
  @IsNumber()
  @Type(() => Number)
  originalAmount: number;

  @ApiPropertyOptional({ description: 'Saldo devedor atual' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  currentBalance?: number;

  @ApiPropertyOptional({ description: 'Total já pago' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalPaid?: number;

  @ApiPropertyOptional({ description: 'Taxa de juros (% ao mês)', example: 1.5 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  interestRate?: number;

  @ApiPropertyOptional({ description: 'Período dos juros: monthly | yearly | daily' })
  @IsOptional()
  @IsString()
  interestPeriod?: string;

  @ApiPropertyOptional({ description: 'Tipo de juros: fixed | variable | compound' })
  @IsOptional()
  @IsString()
  interestType?: string;

  @ApiPropertyOptional({ description: 'Data de início' })
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'Previsão de quitação' })
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Total de parcelas' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  totalInstallments?: number;

  @ApiPropertyOptional({ description: 'Parcelas pagas' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  paidInstallments?: number;

  @ApiPropertyOptional({ description: 'Valor da parcela mensal' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  monthlyPayment?: number;

  @ApiPropertyOptional({ description: 'Próximo vencimento' })
  @IsOptional()
  @Type(() => Date)
  nextDueDate?: Date;

  @ApiPropertyOptional({ description: 'Tipo de garantia: none | real | fidejussoria | aval' })
  @IsOptional()
  @IsString()
  guaranteeType?: string;

  @ApiPropertyOptional({ description: 'Descrição da garantia' })
  @IsOptional()
  @IsString()
  guaranteeDescription?: string;

  @ApiPropertyOptional({ description: 'ID da conta bancária', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @ApiPropertyOptional({ description: 'Número do contrato' })
  @IsOptional()
  @IsString()
  contractNumber?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDebtDto extends PartialType(CreateDebtDto) {}

export class AddDebtPaymentDto {
  @ApiProperty({ description: 'Valor pago', example: 1200.00 })
  @IsNumber()
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({ description: 'Parte do principal' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  principalAmount?: number;

  @ApiPropertyOptional({ description: 'Parte dos juros' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  interestAmount?: number;

  @ApiPropertyOptional({ description: 'Data do pagamento' })
  @IsOptional()
  @Type(() => Date)
  paidAt?: Date;

  @ApiPropertyOptional({ description: 'Método: pix | boleto | debito_automatico' })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ description: 'Nº do comprovante' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Nº da parcela' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  installmentNumber?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BANK STATEMENTS (EXTRATOS BANCÁRIOS)
// ═══════════════════════════════════════════════════════════════════════════════

export class BankStatementEntryDto {
  @ApiProperty({ description: 'Data do lançamento', example: '2025-06-15' })
  @Type(() => Date)
  date: Date;

  @ApiProperty({ description: 'Descrição do lançamento' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Valor (positivo=crédito, negativo=débito)', example: -150.00 })
  @IsNumber()
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({ description: 'Tipo: credit | debit', default: 'credit' })
  @IsOptional()
  @IsString()
  entryType?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Classificação/categoria' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class CreateBankStatementDto {
  @ApiProperty({ description: 'ID da conta bancária', format: 'uuid' })
  @IsUUID()
  bankAccountId: string;

  @ApiProperty({ description: 'Mês de referência (YYYY-MM)', example: '2025-06' })
  @IsString()
  @IsNotEmpty()
  referenceMonth: string;

  @ApiPropertyOptional({ description: 'Nome do arquivo importado' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ description: 'Total de créditos' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalCredits?: number;

  @ApiPropertyOptional({ description: 'Total de débitos' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalDebits?: number;

  @ApiPropertyOptional({ description: 'Saldo inicial' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  openingBalance?: number;

  @ApiPropertyOptional({ description: 'Saldo final' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  closingBalance?: number;

  @ApiPropertyOptional({ enum: StatementStatus, description: 'Status do extrato' })
  @IsOptional()
  @IsEnum(StatementStatus)
  status?: StatementStatus;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Lançamentos do extrato', type: [BankStatementEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BankStatementEntryDto)
  entries?: BankStatementEntryDto[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// MANUAL MATCH ENTRY
// ═══════════════════════════════════════════════════════════════════════════════

export class ManualMatchEntryDto {
  @ApiProperty({ description: 'ID do pagamento a vincular', format: 'uuid' })
  @IsUUID()
  paymentId: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE FROM PROPOSAL / WORK
// ═══════════════════════════════════════════════════════════════════════════════

export class CreatePaymentFromProposalDto {
  @ApiProperty({ description: 'ID da proposta', format: 'uuid' })
  @IsUUID()
  proposalId: string;

  @ApiProperty({ description: 'Número da proposta', example: 'PROP-0042' })
  @IsString()
  @IsNotEmpty()
  proposalNumber: string;

  @ApiProperty({ description: 'ID do cliente', format: 'uuid' })
  @IsUUID()
  clientId: string;

  @ApiProperty({ description: 'Descrição do lançamento' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Valor total da proposta', example: 50000 })
  @IsNumber()
  @Type(() => Number)
  totalAmount: number;

  @ApiPropertyOptional({ description: 'ID da obra', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  workId?: string;

  @ApiProperty({ description: 'Parcelas do pagamento', type: [InstallmentItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InstallmentItemDto)
  installments: InstallmentItemDto[];
}

export class CreatePaymentFromWorkDto {
  @ApiProperty({ description: 'ID da obra', format: 'uuid' })
  @IsUUID()
  workId: string;

  @ApiProperty({ description: 'Descrição do lançamento' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Valor total', example: 30000 })
  @IsNumber()
  @Type(() => Number)
  totalAmount: number;

  @ApiPropertyOptional({ description: 'ID do cliente', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiProperty({ description: 'Parcelas do pagamento', type: [InstallmentItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InstallmentItemDto)
  installments: InstallmentItemDto[];
}
