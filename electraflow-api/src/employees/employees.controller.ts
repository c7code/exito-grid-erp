import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmployeesService } from './employees.service';
import { Employee } from './employee.entity';
import { EmployeeDocument } from './employee-document.entity';

@ApiTags('Funcionários')
@Controller('employees')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmployeesController {
    constructor(private employeesService: EmployeesService) { }

    @Get()
    @ApiOperation({ summary: 'Listar todos os funcionários' })
    async findAll() {
        return this.employeesService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar funcionário por ID' })
    async findOne(@Param('id') id: string) {
        return this.employeesService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Criar novo funcionário' })
    async create(@Body() data: Partial<Employee>) {
        return this.employeesService.create(data);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Atualizar funcionário' })
    async update(@Param('id') id: string, @Body() data: Partial<Employee>) {
        return this.employeesService.update(id, data);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Remover funcionário' })
    async remove(@Param('id') id: string) {
        return this.employeesService.remove(id);
    }

    @Post(':id/documents')
    @ApiOperation({ summary: 'Adicionar documento ao funcionário' })
    async addDocument(@Param('id') id: string, @Body() data: Partial<EmployeeDocument>) {
        return this.employeesService.addDocument(id, data);
    }

    @Put('documents/:id')
    @ApiOperation({ summary: 'Atualizar documento do funcionário' })
    async updateDocument(@Param('id') id: string, @Body() data: Partial<EmployeeDocument>) {
        return this.employeesService.updateDocument(id, data);
    }

    @Delete('documents/:id')
    @ApiOperation({ summary: 'Remover documento do funcionário' })
    async removeDocument(@Param('id') id: string) {
        return this.employeesService.removeDocument(id);
    }
}
