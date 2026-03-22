import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract, ContractAddendum, ContractTemplate } from './contract.entity';
import { ContractsController, ContractPublicController } from './contracts.controller';
import { ContractsService } from './contracts.service';

@Module({
    imports: [TypeOrmModule.forFeature([Contract, ContractAddendum, ContractTemplate])],
    controllers: [ContractsController, ContractPublicController],
    providers: [ContractsService],
    exports: [ContractsService],
})
export class ContractsModule { }
