import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Dashboard completo' })
  async getDashboard() {
    return this.dashboardService.getFullDashboard();
  }

  @Get('kpis')
  @ApiOperation({ summary: 'KPIs principais' })
  async getKPIs() {
    return this.dashboardService.getKPIs();
  }

  @Get('pipeline')
  @ApiOperation({ summary: 'Resumo do pipeline' })
  async getPipeline() {
    return this.dashboardService.getPipelineSummary();
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Alertas do sistema' })
  async getAlerts() {
    return this.dashboardService.getAlerts();
  }
}
