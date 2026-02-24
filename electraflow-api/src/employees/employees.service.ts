import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './employee.entity';
import { EmployeeDocument } from './employee-document.entity';

@Injectable()
export class EmployeesService {
    constructor(
        @InjectRepository(Employee)
        private employeeRepository: Repository<Employee>,
        @InjectRepository(EmployeeDocument)
        private documentRepository: Repository<EmployeeDocument>,
    ) { }

    async findAll(): Promise<Employee[]> {
        return this.employeeRepository.find({
            relations: ['documents'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Employee> {
        const employee = await this.employeeRepository.findOne({
            where: { id },
            relations: ['documents'],
        });
        if (!employee) throw new NotFoundException('Funcionário não encontrado');
        return employee;
    }

    async create(data: Partial<Employee>): Promise<Employee> {
        const employee = this.employeeRepository.create(data);
        return this.employeeRepository.save(employee);
    }

    async update(id: string, data: Partial<Employee>): Promise<Employee> {
        const employee = await this.findOne(id);
        Object.assign(employee, data);
        return this.employeeRepository.save(employee);
    }

    async remove(id: string): Promise<void> {
        const employee = await this.findOne(id);
        await this.employeeRepository.remove(employee);
    }

    async findDocument(id: string): Promise<EmployeeDocument> {
        const doc = await this.documentRepository.findOne({ where: { id } });
        if (!doc) throw new NotFoundException('Documento não encontrado');
        return doc;
    }

    async updateDocument(id: string, data: Partial<EmployeeDocument>): Promise<EmployeeDocument> {
        const doc = await this.documentRepository.findOne({ where: { id } });
        if (!doc) throw new NotFoundException('Documento não encontrado');
        Object.assign(doc, data);
        return this.documentRepository.save(doc);
    }

    async addDocument(employeeId: string, docData: Partial<EmployeeDocument>): Promise<EmployeeDocument> {
        const doc = this.documentRepository.create({
            ...docData,
            employeeId,
        });
        return this.documentRepository.save(doc);
    }

    async removeDocument(id: string): Promise<void> {
        const doc = await this.documentRepository.findOneBy({ id });
        if (!doc) throw new NotFoundException('Documento não encontrado');
        await this.documentRepository.remove(doc);
    }
}
