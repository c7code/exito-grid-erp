import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RulesService } from './rules.service';
import { Rule } from './rule.entity';

@ApiTags('Regras')
@Controller('rules')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RulesController {
  constructor(private rulesService: RulesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar regras' })
  async findAll() {
    return this.rulesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar regra por ID' })
  async findOne(@Param('id') id: string) {
    return this.rulesService.findOne(id);
  }

  @Post('evaluate')
  @ApiOperation({ summary: 'Avaliar regras para contexto' })
  async evaluate(@Body() context: any) {
    return this.rulesService.evaluate(context);
  }

  @Post()
  @ApiOperation({ summary: 'Criar regra' })
  async create(@Body() ruleData: Partial<Rule>) {
    return this.rulesService.create(ruleData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar regra' })
  async update(@Param('id') id: string, @Body() ruleData: Partial<Rule>) {
    return this.rulesService.update(id, ruleData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativar regra' })
  async remove(@Param('id') id: string) {
    await this.rulesService.remove(id);
    return { message: 'Regra desativada com sucesso' };
  }
}
