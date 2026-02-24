import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './employee.entity';
import { EmployeeDocument } from './employee-document.entity';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Employee, EmployeeDocument])],
    providers: [EmployeesService],
    controllers: [EmployeesController],
    exports: [EmployeesService],
})
export class EmployeesModule { }
