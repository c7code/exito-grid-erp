import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SimulationsService } from './simulations.service';

@Controller('simulations')
@UseGuards(JwtAuthGuard)
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  // ── Listagem geral (filtros opcionais via query) ──
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('createdById') createdById?: string,
  ) {
    return this.simulationsService.findAll({ status, createdById });
  }

  // ── Minhas simulações (atalho para o user logado) ──
  @Get('my')
  findMy(@Request() req: any, @Query('status') status?: string) {
    return this.simulationsService.findAll({
      status,
      createdById: req.user?.sub,
    });
  }

  // ── Simulações por proposta ──
  // IMPORTANT: rotas estáticas antes de rotas com :id para evitar conflito
  @Get('by-proposal/:proposalId')
  findByProposal(@Param('proposalId') proposalId: string) {
    return this.simulationsService.findByProposal(proposalId);
  }

  // ── Buscar por ID ──
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.simulationsService.findOne(id);
  }

  // ── Criar sessão ──
  @Post()
  create(@Body() data: any, @Request() req: any) {
    return this.simulationsService.create({
      ...data,
      createdById: req.user?.sub,
    });
  }

  // ── Atualizar sessão ──
  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.simulationsService.update(id, data);
  }

  // ── Atualizar condição selecionada ──
  @Put(':id/selection')
  updateSelection(
    @Param('id') id: string,
    @Body() data: { selectedConditionId: string; selectedTotal?: number; selectedMargin?: number },
  ) {
    return this.simulationsService.updateSelection(id, data);
  }

  // ── Vincular a uma proposta ──
  @Post(':id/link/:proposalId')
  linkToProposal(
    @Param('id') id: string,
    @Param('proposalId') proposalId: string,
  ) {
    return this.simulationsService.linkToProposal(id, proposalId);
  }

  // ── Arquivar sessão ──
  @Post(':id/archive')
  archive(@Param('id') id: string) {
    return this.simulationsService.archive(id);
  }

  // ── Soft delete ──
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.simulationsService.remove(id);
  }
}
