import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PackagesService } from './packages.service';
import { CreatePackageDto, UpdatePackageDto } from './dto';

@ApiTags('Pacotes')
@Controller('packages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PackagesController {
  constructor(private packagesService: PackagesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar pacotes' })
  async findAll() {
    return this.packagesService.findAll();
  }

  @Get('suggest')
  @ApiOperation({ summary: 'Sugerir pacotes por tipo de serviço' })
  async suggest(@Query('serviceType') serviceType: string) {
    return this.packagesService.findByServiceType(serviceType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar pacote por ID' })
  async findOne(@Param('id') id: string) {
    return this.packagesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar pacote' })
  async create(@Body() pkgData: CreatePackageDto) {
    return this.packagesService.create(pkgData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar pacote' })
  async update(@Param('id') id: string, @Body() pkgData: UpdatePackageDto) {
    return this.packagesService.update(id, pkgData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativar pacote' })
  async remove(@Param('id') id: string) {
    await this.packagesService.remove(id);
    return { message: 'Pacote desativado com sucesso' };
  }
}
