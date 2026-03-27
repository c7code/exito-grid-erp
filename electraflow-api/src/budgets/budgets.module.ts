import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { ParametricEngineService } from './parametric-engine.service';
import { Budget } from './budget.entity';
import { BudgetItem } from './budget-item.entity';
import { ServiceRule } from './service-rule.entity';
import { CompanyFinancials } from './company-financials.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Budget, BudgetItem, ServiceRule, CompanyFinancials])],
    controllers: [BudgetsController],
    providers: [BudgetsService, ParametricEngineService],
    exports: [BudgetsService, ParametricEngineService],
})
export class BudgetsModule {}
