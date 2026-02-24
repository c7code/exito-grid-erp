import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard, RolesGuard, RequireRoles } from '../auth/jwt-auth.guard';
import { UserRole } from '../users/user.entity';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('admin')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Dashboard do Administrador' })
  async getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @Get('employee')
  @RequireRoles(UserRole.EMPLOYEE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Dashboard do Funcionário' })
  async getEmployeeDashboard(@Request() req) {
    return this.dashboardService.getEmployeeDashboard(req.user.sub);
  }

  @Get('client')
  @RequireRoles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Dashboard do Cliente' })
  async getClientDashboard(@Request() req) {
    return this.dashboardService.getClientDashboard(req.user.sub);
  }
}
