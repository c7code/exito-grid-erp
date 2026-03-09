import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem, StockMovement, MovementType } from './inventory.entity';

@Injectable()
export class InventoryService {
    constructor(
        @InjectRepository(InventoryItem)
        private itemRepo: Repository<InventoryItem>,
        @InjectRepository(StockMovement)
        private movementRepo: Repository<StockMovement>,
    ) { }

    // ============ Items ============
    async findAllItems(category?: string) {
        const query = this.itemRepo
            .createQueryBuilder('item')
            .where('item.deletedAt IS NULL')
            .orderBy('item.name', 'ASC');

        if (category) {
            query.andWhere('item.category = :category', { category });
        }

        return query.getMany();
    }

    async findOneItem(id: string) {
        const item = await this.itemRepo.findOne({ where: { id }, relations: ['movements'] });
        if (!item) throw new NotFoundException('Item não encontrado');
        return item;
    }

    async createItem(data: Partial<InventoryItem>) {
        const item = this.itemRepo.create(data);
        return this.itemRepo.save(item);
    }

    async updateItem(id: string, data: Partial<InventoryItem>) {
        const item = await this.findOneItem(id);
        Object.assign(item, data);
        return this.itemRepo.save(item);
    }

    async removeItem(id: string) {
        const item = await this.findOneItem(id);
        return this.itemRepo.softRemove(item);
    }

    async getLowStockItems() {
        return this.itemRepo
            .createQueryBuilder('item')
            .where('item.deletedAt IS NULL')
            .andWhere('item.currentStock <= item.minimumStock')
            .andWhere('item.minimumStock > 0')
            .orderBy('item.currentStock', 'ASC')
            .getMany();
    }

    // ============ Movements ============
    async findAllMovements(filters?: { itemId?: string; workId?: string; type?: string }) {
        const query = this.movementRepo
            .createQueryBuilder('mov')
            .leftJoinAndSelect('mov.item', 'item')
            .leftJoinAndSelect('mov.work', 'work')
            .leftJoinAndSelect('mov.performedBy', 'performedBy')
            .where('mov.deletedAt IS NULL')
            .orderBy('mov.createdAt', 'DESC');

        if (filters?.itemId) query.andWhere('mov.itemId = :itemId', { itemId: filters.itemId });
        if (filters?.workId) query.andWhere('mov.workId = :workId', { workId: filters.workId });
        if (filters?.type) query.andWhere('mov.type = :type', { type: filters.type });

        return query.getMany();
    }

    async createMovement(data: Partial<StockMovement>) {
        const item = await this.findOneItem(data.itemId);

        // Update stock based on movement type
        const qty = Number(data.quantity || 0);
        switch (data.type) {
            case MovementType.ENTRY:
            case MovementType.RETURN:
                item.currentStock = Number(item.currentStock) + qty;
                break;
            case MovementType.EXIT:
                if (Number(item.currentStock) < qty) {
                    throw new BadRequestException(`Estoque insuficiente. Disponível: ${item.currentStock} ${item.unit || 'un'}`);
                }
                item.currentStock = Number(item.currentStock) - qty;
                break;
            case MovementType.ADJUSTMENT:
                item.currentStock = qty; // Absolute value
                break;
            case MovementType.TRANSFER:
                // Just log the transfer, stock logic depends on locations
                break;
        }

        await this.itemRepo.save(item);

        const movement = this.movementRepo.create(data);
        return this.movementRepo.save(movement);
    }

    async getInventorySummary() {
        const items = await this.itemRepo.find({ where: { isActive: true } });
        const totalValue = items.reduce((sum, i) => sum + Number(i.currentStock) * Number(i.unitCost), 0);
        const lowStock = items.filter(i => Number(i.minimumStock) > 0 && Number(i.currentStock) <= Number(i.minimumStock));

        return {
            totalItems: items.length,
            totalValue,
            lowStockCount: lowStock.length,
            categories: [...new Set(items.map(i => i.category).filter(Boolean))],
        };
    }
}
