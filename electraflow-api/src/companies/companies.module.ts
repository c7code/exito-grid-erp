import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './company.entity';
import { CompanyDocument } from './company-document.entity';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Company, CompanyDocument])],
    providers: [CompaniesService],
    controllers: [CompaniesController],
    exports: [CompaniesService],
})
export class CompaniesModule {}
