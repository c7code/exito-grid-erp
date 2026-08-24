import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { DailyChecklistService } from "./daily-checklist.service";

@Controller("daily-checklist")
@UseGuards(JwtAuthGuard)
export class DailyChecklistController {
  constructor(private readonly service: DailyChecklistService) {}

  @Get("today")
  getOrCreateToday(@Req() req: any) {
    return this.service.getOrCreateToday(req.user.id);
  }

  @Get("stats")
  getStats(@Req() req: any) {
    return this.service.getStats(req.user.id);
  }

  @Get()
  getAll(@Req() req: any) {
    return this.service.getChecklists(req.user.id);
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.service.getChecklistWithItems(id);
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    return this.service.createChecklist(req.user.id, body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: any) {
    return this.service.updateChecklist(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.deleteChecklist(id);
  }

  // ── Items ──────────────────────────────────────────────────────────────────

  @Post(":id/items")
  addItem(@Param("id") checklistId: string, @Body() body: any) {
    return this.service.addItem(checklistId, body);
  }

  @Patch("items/:itemId/toggle")
  toggleItem(@Param("itemId") id: string) {
    return this.service.toggleItem(id);
  }

  @Patch("items/:itemId")
  updateItem(@Param("itemId") id: string, @Body() body: any) {
    return this.service.updateItem(id, body);
  }

  @Delete("items/:itemId")
  deleteItem(@Param("itemId") id: string) {
    return this.service.deleteItem(id);
  }
}
