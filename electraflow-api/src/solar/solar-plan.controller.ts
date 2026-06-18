import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SolarPlanService } from './solar-plan.service';
import {
  CreateSolarPlanDto, UpdateSolarPlanDto,
  CreateSolarPlanSubscriptionDto, UpdateSolarPlanSubscriptionDto,
  SimulateSolarPlanDto, PayInstallmentDto, UpdateInstallmentDto,
} from './dto';

@Controller('solar-plans')
export class SolarPlanController {

  constructor(private readonly service: SolarPlanService) {}

  // ═══ PLANS ═══
  @Get()
  findAllPlans() { return this.service.findAllPlans(); }

  @Get('dashboard')
  getDashboard() { return this.service.getDashboard(); }

  @Post('simulate')
  simulate(@Body() body: SimulateSolarPlanDto) { return this.service.simulate(body as any); }

  @Get(':id')
  findOnePlan(@Param('id') id: string) { return this.service.findOnePlan(id); }

  @Post()
  createPlan(@Body() body: CreateSolarPlanDto) { return this.service.createPlan(body as any); }

  @Put(':id')
  updatePlan(@Param('id') id: string, @Body() body: UpdateSolarPlanDto) { return this.service.updatePlan(id, body as any); }

  @Delete(':id')
  removePlan(@Param('id') id: string) { return this.service.removePlan(id); }

  // ═══ SUBSCRIPTIONS ═══
  @Get('subscriptions/all')
  findAllSubscriptions(@Query('status') status?: string) { return this.service.findAllSubscriptions(status); }

  @Get('subscriptions/:id')
  findOneSubscription(@Param('id') id: string) { return this.service.findOneSubscription(id); }

  @Post('subscriptions')
  createSubscription(@Body() body: CreateSolarPlanSubscriptionDto) { return this.service.createSubscription(body as any); }

  @Put('subscriptions/:id')
  updateSubscription(@Param('id') id: string, @Body() body: UpdateSolarPlanSubscriptionDto) { return this.service.updateSubscription(id, body as any); }

  @Post('subscriptions/:id/cancel')
  cancelSubscription(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.service.cancelSubscription(id, body.reason);
  }

  @Post('subscriptions/:id/start-installation')
  startInstallation(@Param('id') id: string) { return this.service.startInstallation(id); }

  @Post('subscriptions/:id/complete-installation')
  completeInstallation(@Param('id') id: string) { return this.service.completeInstallation(id); }

  // ═══ INSTALLMENTS ═══
  @Get('subscriptions/:id/installments')
  getInstallments(@Param('id') id: string) { return this.service.getInstallments(id); }

  @Post('installments/:id/pay')
  payInstallment(@Param('id') id: string, @Body() body: PayInstallmentDto) { return this.service.payInstallment(id, body as any); }

  @Put('installments/:id')
  updateInstallment(@Param('id') id: string, @Body() body: UpdateInstallmentDto) { return this.service.updateInstallment(id, body as any); }

  // ═══ CLIENT PORTAL ═══
  @Get('client/:clientId')
  getClientSubscriptions(@Param('clientId') clientId: string) { return this.service.getClientSubscriptions(clientId); }
}
