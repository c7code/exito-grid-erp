import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DailyChecklist, DailyChecklistItem } from "./daily-checklist.entity";

@Injectable()
export class DailyChecklistService {
  constructor(
    @InjectRepository(DailyChecklist)
    private checklistRepo: Repository<DailyChecklist>,
    @InjectRepository(DailyChecklistItem)
    private itemRepo: Repository<DailyChecklistItem>,
  ) {}

  // ── Checklists ─────────────────────────────────────────────────────────────

  async getChecklists(userId: string) {
    return this.checklistRepo
      .createQueryBuilder("c")
      .where("c.deletedAt IS NULL")
      .andWhere("c.userId = :userId", { userId })
      .orderBy("c.date", "DESC")
      .getMany();
  }

  async getOrCreateToday(userId: string) {
    const today = new Date().toISOString().substring(0, 10);
    let checklist = await this.checklistRepo.findOne({
      where: { date: today, userId },
    });
    if (!checklist) {
      checklist = this.checklistRepo.create({
        date: today,
        title: `Checklist ${new Date().toLocaleDateString("pt-BR")}`,
        userId,
      });
      checklist = await this.checklistRepo.save(checklist);
    }
    const items = await this.itemRepo.find({
      where: { checklistId: checklist.id },
      order: { order: "ASC", createdAt: "ASC" },
    });
    return { ...checklist, items };
  }

  async getChecklistWithItems(id: string) {
    const checklist = await this.checklistRepo.findOne({ where: { id } });
    const items = await this.itemRepo.find({
      where: { checklistId: id },
      order: { order: "ASC", createdAt: "ASC" },
    });
    return { ...checklist, items };
  }

  async createChecklist(userId: string, data: Partial<DailyChecklist>) {
    const entity = this.checklistRepo.create({ ...data, userId });
    return this.checklistRepo.save(entity);
  }

  async updateChecklist(id: string, data: Partial<DailyChecklist>) {
    await this.checklistRepo.update(id, data);
    return this.getChecklistWithItems(id);
  }

  async deleteChecklist(id: string) {
    await this.checklistRepo.softDelete(id);
  }

  // ── Items ──────────────────────────────────────────────────────────────────

  async addItem(checklistId: string, data: Partial<DailyChecklistItem>) {
    const count = await this.itemRepo.count({ where: { checklistId } });
    const entity = this.itemRepo.create({ ...data, checklistId, order: count });
    return this.itemRepo.save(entity);
  }

  async updateItem(id: string, data: Partial<DailyChecklistItem>) {
    if (data.done !== undefined) {
      data.completedAt = data.done ? new Date() : null;
    }
    await this.itemRepo.update(id, data);
    return this.itemRepo.findOne({ where: { id } });
  }

  async toggleItem(id: string) {
    const item = await this.itemRepo.findOne({ where: { id } });
    const done = !item.done;
    await this.itemRepo.update(id, {
      done,
      completedAt: done ? new Date() : null,
    });
    return this.itemRepo.findOne({ where: { id } });
  }

  async deleteItem(id: string) {
    await this.itemRepo.delete(id);
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  async getStats(userId: string) {
    const last7 = await this.checklistRepo
      .createQueryBuilder("c")
      .where("c.userId = :userId", { userId })
      .andWhere("c.deletedAt IS NULL")
      .andWhere("c.date >= :d", { d: new Date(Date.now() - 7 * 86400000).toISOString().substring(0, 10) })
      .getMany();

    const ids = last7.map(c => c.id);
    if (ids.length === 0) return { totalItems: 0, doneItems: 0, completionRate: 0, streak: 0 };

    const items = ids.length > 0
      ? await this.itemRepo
          .createQueryBuilder("i")
          .where("i.checklistId = ANY(:ids)", { ids })
          .getMany()
      : [];

    const totalItems = items.length;
    const doneItems = items.filter(i => i.done).length;
    const completionRate = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

    return { totalItems, doneItems, completionRate, totalDays: last7.length };
  }
}
