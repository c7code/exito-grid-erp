import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LaudosService } from './laudos.service';

@ApiTags('Laudos - Público')
@Controller('laudos/public')
export class LaudosPublicController {
  constructor(private readonly svc: LaudosService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Buscar laudo por token público' })
  findByToken(@Param('token') token: string) {
    return this.svc.findByToken(token);
  }

  @Post(':token')
  @ApiOperation({ summary: 'Submeter formulário público' })
  submitPublicForm(@Param('token') token: string, @Body() data: { client: any; dados: any }) {
    return this.svc.submitPublicForm(token, data);
  }
}
