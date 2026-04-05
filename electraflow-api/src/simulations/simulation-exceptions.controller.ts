import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SimulationExceptionsService } from './simulation-exceptions.service';

@Controller('simulation-exceptions')
@UseGuards(JwtAuthGuard)
export class SimulationExceptionsController {
  constructor(private readonly exceptionsService: SimulationExceptionsService) {}

  // ── Listar todas (com filtros) ──
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.exceptionsService.findAll({ status, sessionId });
  }

  // ── Pendentes de aprovação ──
  @Get('pending')
  findPending() {
    return this.exceptionsService.findPending();
  }

  // ── Por sessão ──
  @Get('by-session/:sessionId')
  findBySession(@Param('sessionId') sessionId: string) {
    return this.exceptionsService.findBySession(sessionId);
  }

  // ── Buscar por ID ──
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exceptionsService.findOne(id);
  }

  // ── Audit trail de uma exceção ──
  @Get(':id/audit')
  getAuditTrail(@Param('id') id: string) {
    return this.exceptionsService.getAuditTrail(id);
  }

  // ── Solicitar exceção ──
  @Post()
  requestException(@Body() data: any, @Request() req: any) {
    return this.exceptionsService.requestException({
      ...data,
      requestedById: req.user?.sub,
      requestedByName: req.user?.name || req.user?.email || 'Operador',
    });
  }

  // ── Aprovar ──
  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    return this.exceptionsService.approve(id, {
      approvedById: req.user?.sub,
      approvedByName: req.user?.name || req.user?.email || 'Aprovador',
      approvalNote: data.approvalNote,
    });
  }

  // ── Rejeitar ──
  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    return this.exceptionsService.reject(id, {
      approvedById: req.user?.sub,
      approvedByName: req.user?.name || req.user?.email || 'Aprovador',
      approvalNote: data.approvalNote,
    });
  }
}
