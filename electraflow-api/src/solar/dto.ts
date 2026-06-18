import { IsString, IsOptional, IsNumber, IsUUID, IsBoolean, IsNotEmpty, IsArray, IsEnum, IsInt, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ════════════════════════════════════════════════════════════════
// SOLAR PROJECT DTOs
// ════════════════════════════════════════════════════════════════

class MonthlyConsumptionDto {
    @ApiProperty({ description: 'Mês', example: 'Jan' })
    @IsString()
    month: string;

    @ApiProperty({ description: 'Consumo total (kWh)', example: 350 })
    @IsNumber()
    kwh: number;

    @ApiPropertyOptional({ description: 'Consumo ponta (kWh) — MT' })
    @IsOptional()
    @IsNumber()
    peakKwh?: number;

    @ApiPropertyOptional({ description: 'Consumo fora ponta (kWh) — MT' })
    @IsOptional()
    @IsNumber()
    offPeakKwh?: number;

    @ApiPropertyOptional({ description: 'Valor da conta (R$)' })
    @IsOptional()
    @IsNumber()
    billValue?: number;
}

class EquipmentItemDto {
    @ApiPropertyOptional({ description: 'ID do item do catálogo' })
    @IsOptional()
    @IsString()
    catalogItemId?: string;

    @ApiProperty({ description: 'Tipo: module, inverter, structure, stringbox, cable, protection, other', example: 'module' })
    @IsString()
    type: string;

    @ApiProperty({ description: 'Descrição do equipamento' })
    @IsString()
    description: string;

    @ApiPropertyOptional({ description: 'Marca' })
    @IsOptional()
    @IsString()
    brand?: string;

    @ApiPropertyOptional({ description: 'Modelo' })
    @IsOptional()
    @IsString()
    model?: string;

    @ApiPropertyOptional({ description: 'Garantia' })
    @IsOptional()
    @IsString()
    warranty?: string;

    @ApiProperty({ description: 'Quantidade', example: 10 })
    @IsNumber()
    quantity: number;

    @ApiProperty({ description: 'Preço unitário (R$)', example: 850.00 })
    @IsNumber()
    unitPrice: number;

    @ApiProperty({ description: 'Total (R$)', example: 8500.00 })
    @IsNumber()
    total: number;
}

class PaymentConditionsDto {
    @ApiPropertyOptional({ description: 'Método: avista | parcelado | financiamento | entrada_parcelas' })
    @IsOptional()
    @IsString()
    method?: string;

    @ApiPropertyOptional({ description: 'Valor da entrada (R$)' })
    @IsOptional()
    @IsNumber()
    downPayment?: number;

    @ApiPropertyOptional({ description: '% de entrada' })
    @IsOptional()
    @IsNumber()
    downPaymentPercent?: number;

    @ApiPropertyOptional({ description: 'Número de parcelas' })
    @IsOptional()
    @IsNumber()
    installments?: number;

    @ApiPropertyOptional({ description: 'Valor de cada parcela' })
    @IsOptional()
    @IsNumber()
    installmentValue?: number;

    @ApiPropertyOptional({ description: 'Taxa de juros mensal (%)' })
    @IsOptional()
    @IsNumber()
    interestRate?: number;

    @ApiPropertyOptional({ description: 'Tipo de juros: sem_juros | embutido | sobre_saldo' })
    @IsOptional()
    @IsString()
    interestType?: string;

    @ApiPropertyOptional({ description: 'Bandeira do cartão' })
    @IsOptional()
    @IsString()
    cardBrand?: string;

    @ApiPropertyOptional({ description: 'Banco financiador' })
    @IsOptional()
    @IsString()
    financingBank?: string;

    @ApiPropertyOptional({ description: 'Linha de crédito (ex: CDC Solar, BNDES)' })
    @IsOptional()
    @IsString()
    financingLine?: string;

    @ApiPropertyOptional({ description: 'Desconto para PIX (%)' })
    @IsOptional()
    @IsNumber()
    pixDiscount?: number;

    @ApiPropertyOptional({ description: 'Observações adicionais' })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class CreateSolarProjectDto {
    @ApiProperty({ description: 'Código único do projeto', example: 'SOL-0042' })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiPropertyOptional({ description: 'Título do projeto' })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({ description: 'ID do cliente' })
    @IsOptional()
    @IsUUID()
    clientId?: string;

    @ApiPropertyOptional({ description: 'ID da empresa' })
    @IsOptional()
    @IsString()
    companyId?: string;

    // ── Diagnóstico energético ──
    @ApiPropertyOptional({ description: 'Categoria de faturamento: BT ou MT', default: 'BT' })
    @IsOptional()
    @IsString()
    billingCategory?: string;

    @ApiPropertyOptional({ description: 'Análise detalhada da conta' })
    @IsOptional()
    @IsBoolean()
    detailedAnalysis?: boolean;

    @ApiPropertyOptional({ description: 'Consumos mensais', type: [MonthlyConsumptionDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MonthlyConsumptionDto)
    monthlyConsumptions?: MonthlyConsumptionDto[];

    @ApiPropertyOptional({ description: 'Consumo médio (kWh)', example: 350 })
    @IsOptional()
    @IsNumber()
    consumptionKwh?: number;

    @ApiPropertyOptional({ description: 'Valor médio da conta (R$)' })
    @IsOptional()
    @IsNumber()
    avgBillValue?: number;

    @ApiPropertyOptional({ description: 'Tarifa (R$/kWh)' })
    @IsOptional()
    @IsNumber()
    tariff?: number;

    @ApiPropertyOptional({ description: 'Tipo de conexão: monophasic | biphasic | triphasic', default: 'biphasic' })
    @IsOptional()
    @IsString()
    connectionType?: string;

    @ApiPropertyOptional({ description: 'Demanda contratada (kW)' })
    @IsOptional()
    @IsNumber()
    contractedDemand?: number;

    @ApiPropertyOptional({ description: 'Tipo de medidor' })
    @IsOptional()
    @IsString()
    meterType?: string;

    @ApiPropertyOptional({ description: 'Concessionária' })
    @IsOptional()
    @IsString()
    concessionaria?: string;

    // ── Média Tensão ──
    @ApiPropertyOptional({ description: 'Consumo ponta (kWh)' })
    @IsOptional()
    @IsNumber()
    consumptionPeakKwh?: number;

    @ApiPropertyOptional({ description: 'Consumo fora ponta (kWh)' })
    @IsOptional()
    @IsNumber()
    consumptionOffPeakKwh?: number;

    @ApiPropertyOptional({ description: 'Tarifa ponta (R$/kWh)' })
    @IsOptional()
    @IsNumber()
    tariffPeak?: number;

    @ApiPropertyOptional({ description: 'Tarifa fora ponta (R$/kWh)' })
    @IsOptional()
    @IsNumber()
    tariffOffPeak?: number;

    @ApiPropertyOptional({ description: 'Demanda ponta (kW)' })
    @IsOptional()
    @IsNumber()
    demandPeakKw?: number;

    @ApiPropertyOptional({ description: 'Demanda fora ponta (kW)' })
    @IsOptional()
    @IsNumber()
    demandOffPeakKw?: number;

    @ApiPropertyOptional({ description: 'Modalidade tarifária: Verde | Azul | Convencional' })
    @IsOptional()
    @IsString()
    tariffModality?: string;

    // ── Dados do imóvel ──
    @ApiPropertyOptional({ description: 'Tipo de instalação: roof | ground', default: 'roof' })
    @IsOptional()
    @IsString()
    installationType?: string;

    @ApiPropertyOptional({ description: 'Área disponível (m²)' })
    @IsOptional()
    @IsNumber()
    availableArea?: number;

    @ApiPropertyOptional({ description: 'Orientação do telhado' })
    @IsOptional()
    @IsString()
    roofOrientation?: string;

    @ApiPropertyOptional({ description: 'Inclinação do telhado (graus)' })
    @IsOptional()
    @IsNumber()
    roofInclination?: number;

    @ApiPropertyOptional({ description: 'Possui sombreamento' })
    @IsOptional()
    @IsBoolean()
    hasShadows?: boolean;

    @ApiPropertyOptional({ description: 'CEP do imóvel' })
    @IsOptional()
    @IsString()
    propertyCep?: string;

    @ApiPropertyOptional({ description: 'Endereço do imóvel' })
    @IsOptional()
    @IsString()
    propertyAddress?: string;

    @ApiPropertyOptional({ description: 'Bairro do imóvel' })
    @IsOptional()
    @IsString()
    propertyNeighborhood?: string;

    @ApiPropertyOptional({ description: 'Cidade do imóvel' })
    @IsOptional()
    @IsString()
    propertyCity?: string;

    @ApiPropertyOptional({ description: 'Estado do imóvel' })
    @IsOptional()
    @IsString()
    propertyState?: string;

    // ── Equipamentos ──
    @ApiPropertyOptional({ description: 'Lista de equipamentos', type: [EquipmentItemDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EquipmentItemDto)
    equipment?: EquipmentItemDto[];

    // ── Kits Comerciais ──
    @ApiPropertyOptional({ description: 'Estratégia comercial habilitada' })
    @IsOptional()
    @IsBoolean()
    commercialStrategyEnabled?: boolean;

    @ApiPropertyOptional({ description: 'Kits comerciais (JSON)' })
    @IsOptional()
    @IsArray()
    commercialKits?: any[];

    // ── Custos adicionais ──
    @ApiPropertyOptional({ description: 'Custo de mão de obra (R$)' })
    @IsOptional()
    @IsNumber()
    laborCost?: number;

    @ApiPropertyOptional({ description: 'Custo de instalação (R$)' })
    @IsOptional()
    @IsNumber()
    installationCost?: number;

    @ApiPropertyOptional({ description: 'Custo de logística / frete (R$)' })
    @IsOptional()
    @IsNumber()
    logisticsCost?: number;

    @ApiPropertyOptional({ description: 'Custo de seguro (R$)' })
    @IsOptional()
    @IsNumber()
    insuranceCost?: number;

    @ApiPropertyOptional({ description: 'Custo de engenharia (R$)' })
    @IsOptional()
    @IsNumber()
    engineeringCost?: number;

    @ApiPropertyOptional({ description: 'Custo de documentação (R$)' })
    @IsOptional()
    @IsNumber()
    documentationCost?: number;

    @ApiPropertyOptional({ description: 'Outros custos (R$)' })
    @IsOptional()
    @IsNumber()
    otherCosts?: number;

    // ── Condições de pagamento ──
    @ApiPropertyOptional({ description: 'Condições de pagamento', type: PaymentConditionsDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => PaymentConditionsDto)
    paymentConditions?: PaymentConditionsDto;

    @ApiPropertyOptional({ description: 'Margem de lucro (%)' })
    @IsOptional()
    @IsNumber()
    margin?: number;

    // ── Parâmetros ajustáveis ──
    @ApiPropertyOptional({ description: 'Aumento anual de energia (%)', default: 6 })
    @IsOptional()
    @IsNumber()
    annualEnergyIncrease?: number;

    @ApiPropertyOptional({ description: 'Degradação anual dos painéis (%)', default: 0.5 })
    @IsOptional()
    @IsNumber()
    annualDegradation?: number;

    @ApiPropertyOptional({ description: 'Observações' })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateSolarProjectDto extends PartialType(CreateSolarProjectDto) {}

// ════════════════════════════════════════════════════════════════
// SOLAR PLAN DTOs
// ════════════════════════════════════════════════════════════════

class PlanEquipmentItemDto {
    @ApiProperty({ description: 'Tipo: module, inverter, structure, cable, protection, other' })
    @IsString()
    type: string;

    @ApiProperty({ description: 'Descrição' })
    @IsString()
    description: string;

    @ApiPropertyOptional({ description: 'Marca' })
    @IsOptional()
    @IsString()
    brand?: string;

    @ApiPropertyOptional({ description: 'Modelo' })
    @IsOptional()
    @IsString()
    model?: string;

    @ApiProperty({ description: 'Quantidade', example: 10 })
    @IsNumber()
    quantity: number;
}

export class CreateSolarPlanDto {
    @ApiProperty({ description: 'Nome do plano', example: 'Plano Solar 48x' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: 'Descrição do plano' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Status: active | inactive', default: 'active' })
    @IsOptional()
    @IsString()
    status?: string;

    // ── Configuração do sistema solar ──
    @ApiPropertyOptional({ description: 'Potência mínima (kWp)' })
    @IsOptional()
    @IsNumber()
    minPowerKwp?: number;

    @ApiPropertyOptional({ description: 'Potência máxima (kWp)' })
    @IsOptional()
    @IsNumber()
    maxPowerKwp?: number;

    @ApiPropertyOptional({ description: 'Potência fixa do kit (kWp)', example: 5.5 })
    @IsOptional()
    @IsNumber()
    systemPowerKwp?: number;

    @ApiPropertyOptional({ description: 'Preço base do kit (R$)' })
    @IsOptional()
    @IsNumber()
    basePrice?: number;

    @ApiPropertyOptional({ description: 'Custo do equipamento (R$)' })
    @IsOptional()
    @IsNumber()
    equipmentCost?: number;

    @ApiPropertyOptional({ description: 'Custo de instalação (R$)' })
    @IsOptional()
    @IsNumber()
    installationCost?: number;

    @ApiPropertyOptional({ description: 'Equipamentos inclusos', type: [PlanEquipmentItemDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PlanEquipmentItemDto)
    equipment?: PlanEquipmentItemDto[];

    @ApiPropertyOptional({ description: 'Máximo de vagas (0 = ilimitado)', default: 0 })
    @IsOptional()
    @IsInt()
    maxSlots?: number;

    // ── Configuração financeira ──
    @ApiPropertyOptional({ description: 'Total de parcelas', default: 48 })
    @IsOptional()
    @IsInt()
    totalInstallments?: number;

    @ApiPropertyOptional({ description: 'Taxa de adesão (%)', default: 10 })
    @IsOptional()
    @IsNumber()
    enrollmentFeePercent?: number;

    @ApiPropertyOptional({ description: '% mínimo pago para contemplar', default: 50 })
    @IsOptional()
    @IsNumber()
    contemplationThresholdPercent?: number;

    @ApiPropertyOptional({ description: 'Meses mínimos antes de contemplar', default: 0 })
    @IsOptional()
    @IsInt()
    contemplationMinMonths?: number;

    @ApiPropertyOptional({ description: '% multa por cancelamento', default: 20 })
    @IsOptional()
    @IsNumber()
    cancellationFeePercent?: number;

    @ApiPropertyOptional({ description: 'Dias para arrependimento (CDC)', default: 7 })
    @IsOptional()
    @IsInt()
    gracePeriodDays?: number;

    @ApiPropertyOptional({ description: 'Índice de reajuste anual', default: 'IGPM' })
    @IsOptional()
    @IsString()
    adjustmentIndex?: string;

    @ApiPropertyOptional({ description: 'Margem de segurança (%)', default: 15 })
    @IsOptional()
    @IsNumber()
    safetyMarginPercent?: number;

    @ApiPropertyOptional({ description: 'Dias de inadimplência para cancelar', default: 90 })
    @IsOptional()
    @IsInt()
    defaultDaysToCancel?: number;
}

export class UpdateSolarPlanDto extends PartialType(CreateSolarPlanDto) {}

// ════════════════════════════════════════════════════════════════
// SOLAR PLAN SUBSCRIPTION DTOs
// ════════════════════════════════════════════════════════════════

export class CreateSolarPlanSubscriptionDto {
    @ApiProperty({ description: 'ID do plano' })
    @IsUUID()
    @IsNotEmpty()
    planId: string;

    @ApiProperty({ description: 'ID do cliente' })
    @IsUUID()
    @IsNotEmpty()
    clientId: string;

    @ApiProperty({ description: 'Valor total do plano (R$)', example: 35000 })
    @IsNumber()
    @IsNotEmpty()
    totalValue: number;

    @ApiPropertyOptional({ description: 'Total de parcelas', default: 48 })
    @IsOptional()
    @IsInt()
    totalInstallments?: number;

    // ── Conta de luz atual ──
    @ApiPropertyOptional({ description: 'Valor médio mensal da conta de luz (R$)' })
    @IsOptional()
    @IsNumber()
    currentMonthlyBill?: number;

    @ApiPropertyOptional({ description: 'Consumo médio mensal (kWh)' })
    @IsOptional()
    @IsNumber()
    currentConsumptionKwh?: number;

    @ApiPropertyOptional({ description: 'Concessionária de energia' })
    @IsOptional()
    @IsString()
    utilityCompany?: string;

    // ── Sistema solar ──
    @ApiPropertyOptional({ description: 'Potência do sistema (kWp)' })
    @IsOptional()
    @IsNumber()
    systemPowerKwp?: number;

    @ApiPropertyOptional({ description: 'Economia mensal estimada pós-instalação (R$)' })
    @IsOptional()
    @IsNumber()
    estimatedMonthlySavings?: number;

    @ApiPropertyOptional({ description: 'Custo dos equipamentos (R$)' })
    @IsOptional()
    @IsNumber()
    equipmentCost?: number;

    @ApiPropertyOptional({ description: 'Custo de instalação (R$)' })
    @IsOptional()
    @IsNumber()
    installationCost?: number;

    // ── Endereço de instalação ──
    @ApiPropertyOptional({ description: 'Endereço do imóvel' })
    @IsOptional()
    @IsString()
    propertyAddress?: string;

    @ApiPropertyOptional({ description: 'Cidade' })
    @IsOptional()
    @IsString()
    propertyCity?: string;

    @ApiPropertyOptional({ description: 'Estado' })
    @IsOptional()
    @IsString()
    propertyState?: string;

    @ApiPropertyOptional({ description: 'CEP' })
    @IsOptional()
    @IsString()
    propertyCep?: string;

    @ApiPropertyOptional({ description: 'Observações' })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateSolarPlanSubscriptionDto extends PartialType(CreateSolarPlanSubscriptionDto) {}

// ════════════════════════════════════════════════════════════════
// SIMULATION DTO
// ════════════════════════════════════════════════════════════════

export class SimulateSolarPlanDto {
    @ApiPropertyOptional({ description: 'Potência do sistema (kWp)' })
    @IsOptional()
    @IsNumber()
    systemPowerKwp?: number;

    @ApiPropertyOptional({ description: 'Custo do equipamento (R$)' })
    @IsOptional()
    @IsNumber()
    equipmentCost?: number;

    @ApiPropertyOptional({ description: 'Custo de instalação (R$)' })
    @IsOptional()
    @IsNumber()
    installationCost?: number;

    @ApiPropertyOptional({ description: 'Margem de segurança (%)' })
    @IsOptional()
    @IsNumber()
    safetyMarginPercent?: number;

    @ApiPropertyOptional({ description: 'Total de parcelas' })
    @IsOptional()
    @IsInt()
    totalInstallments?: number;

    @ApiPropertyOptional({ description: 'Taxa de adesão (%)' })
    @IsOptional()
    @IsNumber()
    enrollmentFeePercent?: number;

    @ApiPropertyOptional({ description: 'Valor médio da conta de luz (R$)' })
    @IsOptional()
    @IsNumber()
    currentMonthlyBill?: number;
}

// ════════════════════════════════════════════════════════════════
// INSTALLMENT DTOs
// ════════════════════════════════════════════════════════════════

export class PayInstallmentDto {
    @ApiPropertyOptional({ description: 'Valor pago (R$)' })
    @IsOptional()
    @IsNumber()
    paidAmount?: number;

    @ApiPropertyOptional({ description: 'Método de pagamento: pix | boleto | bank_transfer | cash' })
    @IsOptional()
    @IsString()
    paymentMethod?: string;

    @ApiPropertyOptional({ description: 'Multa por atraso (R$)' })
    @IsOptional()
    @IsNumber()
    lateFee?: number;

    @ApiPropertyOptional({ description: 'Juros por atraso (R$)' })
    @IsOptional()
    @IsNumber()
    interestAmount?: number;

    @ApiPropertyOptional({ description: 'Observações' })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateInstallmentDto {
    @ApiPropertyOptional({ description: 'Valor da parcela (R$)' })
    @IsOptional()
    @IsNumber()
    amount?: number;

    @ApiPropertyOptional({ description: 'Data de vencimento' })
    @IsOptional()
    @IsString()
    dueDate?: string;

    @ApiPropertyOptional({ description: 'Status: pending | paid | overdue | cancelled' })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional({ description: 'URL do boleto' })
    @IsOptional()
    @IsString()
    boletoUrl?: string;

    @ApiPropertyOptional({ description: 'QR Code PIX' })
    @IsOptional()
    @IsString()
    pixQrCode?: string;

    @ApiPropertyOptional({ description: 'Observações' })
    @IsOptional()
    @IsString()
    notes?: string;
}
