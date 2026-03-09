import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract, ContractAddendum } from './contract.entity';
import { ContractsController, ContractPublicController } from './contracts.controller';
import { ContractsService } from './contracts.service';

@Module({
    imports: [TypeOrmModule.forFeature([Contract, ContractAddendum])],
    controllers: [ContractsController, ContractPublicController],
    providers: [ContractsService],
    exports: [ContractsService],
})
export class ContractsModule { }
