import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MarketingService } from './marketing.service';

@Controller('marketing')
@UseGuards(JwtAuthGuard)
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  // ── KPIs ──────────────────────────────────────────────────────────────────
  @Get('kpis')
  getKpis(@Query('campaignId') campaignId?: string) {
    return this.marketingService.getKpis(campaignId);
  }

  // ── Campaigns ─────────────────────────────────────────────────────────────
  @Get('campaigns')
  getCampaigns(
    @Query('status') status?: string,
    @Query('channel') channel?: string,
  ) {
    return this.marketingService.getCampaigns({ status, channel });
  }

  @Get('campaigns/:id')
  getCampaignById(@Param('id') id: string) {
    return this.marketingService.getCampaignById(id);
  }

  @Post('campaigns')
  createCampaign(@Body() body: any) {
    return this.marketingService.createCampaign(body);
  }

  @Patch('campaigns/:id')
  updateCampaign(@Param('id') id: string, @Body() body: any) {
    return this.marketingService.updateCampaign(id, body);
  }

  @Delete('campaigns/:id')
  deleteCampaign(@Param('id') id: string) {
    return this.marketingService.deleteCampaign(id);
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  @Get('actions')
  getActions(@Query('campaignId') campaignId?: string) {
    return this.marketingService.getActions(campaignId);
  }

  @Post('actions')
  createAction(@Body() body: any) {
    return this.marketingService.createAction(body);
  }

  @Patch('actions/:id')
  updateAction(@Param('id') id: string, @Body() body: any) {
    return this.marketingService.updateAction(id, body);
  }

  @Delete('actions/:id')
  deleteAction(@Param('id') id: string) {
    return this.marketingService.deleteAction(id);
  }
}
