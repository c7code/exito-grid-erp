import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EquipmentService } from './equipment.service';

@ApiTags('Equipment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly svc: EquipmentService) {}

  // ═══ EQUIPMENT ═══
  @Get()
  @ApiOperation({ summary: 'Listar equipamentos' })
  getAll() { return this.svc.getAll(); }

  @Get('stats')
  @ApiOperation({ summary: 'Dashboard stats' })
  getStats() { return this.svc.getStats(); }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes do equipamento' })
  getById(@Param('id') id: string) { return this.svc.getById(id); }

  @Post()
  @ApiOperation({ summary: 'Criar equipamento' })
  create(@Body() data: any) { return this.svc.create(data); }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar equipamento' })
  update(@Param('id') id: string, @Body() data: any) { return this.svc.update(id, data); }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover equipamento' })
  remove(@Param('id') id: string) { return this.svc.remove(id); }

  // ═══ RENTALS ═══
  @Get('rentals/all')
  @ApiOperation({ summary: 'Listar locações' })
  getRentals() { return this.svc.getRentals(); }

  @Get('rentals/:id')
  getRentalById(@Param('id') id: string) { return this.svc.getRentalById(id); }

  @Post('rentals')
  @ApiOperation({ summary: 'Criar locação' })
  createRental(@Body() data: any) { return this.svc.createRental(data); }

  @Put('rentals/:id')
  updateRental(@Param('id') id: string, @Body() data: any) { return this.svc.updateRental(id, data); }

  @Patch('rentals/:id/status')
  updateRentalStatus(@Param('id') id: string, @Body() data: { status: string }) {
    return this.svc.updateRental(id, data);
  }

  @Delete('rentals/:id')
  removeRental(@Param('id') id: string) { return this.svc.removeRental(id); }

  // ═══ MAINTENANCE ═══
  @Get('maintenance/all')
  @ApiOperation({ summary: 'Listar manutenções' })
  getMaintenances(@Query('equipmentId') equipmentId?: string) {
    return this.svc.getMaintenances(equipmentId);
  }

  @Post('maintenance')
  @ApiOperation({ summary: 'Criar manutenção' })
  createMaintenance(@Body() data: any) { return this.svc.createMaintenance(data); }

  @Put('maintenance/:id')
  updateMaintenance(@Param('id') id: string, @Body() data: any) { return this.svc.updateMaintenance(id, data); }

  @Delete('maintenance/:id')
  removeMaintenance(@Param('id') id: string) { return this.svc.removeMaintenance(id); }

  // ═══ DAILY LOGS ═══
  @Get('daily-logs/all')
  @ApiOperation({ summary: 'Listar diárias' })
  getDailyLogs(@Query('rentalId') rentalId?: string) { return this.svc.getDailyLogs(rentalId); }

  @Post('daily-logs')
  @ApiOperation({ summary: 'Registrar diária' })
  createDailyLog(@Body() data: any) { return this.svc.createDailyLog(data); }

  @Put('daily-logs/:id')
  updateDailyLog(@Param('id') id: string, @Body() data: any) { return this.svc.updateDailyLog(id, data); }

  @Delete('daily-logs/:id')
  removeDailyLog(@Param('id') id: string) { return this.svc.removeDailyLog(id); }

  @Post('daily-logs/bill/:rentalId')
  @ApiOperation({ summary: 'Faturar diárias de uma locação' })
  billDailyLogs(@Param('rentalId') rentalId: string) { return this.svc.billDailyLogs(rentalId); }

  // ═══ SERVICES (Pontuais) ═══
  @Get('services/all')
  @ApiOperation({ summary: 'Listar serviços pontuais' })
  getServices() { return this.svc.getServices(); }

  @Get('services/:id')
  getServiceById(@Param('id') id: string) { return this.svc.getServiceById(id); }

  @Post('services')
  @ApiOperation({ summary: 'Criar serviço pontual' })
  createService(@Body() data: any) { return this.svc.createService(data); }

  @Put('services/:id')
  updateService(@Param('id') id: string, @Body() data: any) { return this.svc.updateService(id, data); }

  @Delete('services/:id')
  removeService(@Param('id') id: string) { return this.svc.removeService(id); }

  @Post('services/:id/bill')
  @ApiOperation({ summary: 'Faturar serviço pontual' })
  billService(@Param('id') id: string) { return this.svc.billService(id); }

  // ═══ CHECKLISTS (Vistorias) ═══
  @Get('checklists/all')
  @ApiOperation({ summary: 'Listar vistorias' })
  getChecklists(@Query('rentalId') rentalId?: string) { return this.svc.getChecklists(rentalId); }

  @Post('checklists')
  @ApiOperation({ summary: 'Criar vistoria' })
  createChecklist(@Body() data: any) { return this.svc.createChecklist(data); }

  @Put('checklists/:id')
  updateChecklist(@Param('id') id: string, @Body() data: any) { return this.svc.updateChecklist(id, data); }
}
