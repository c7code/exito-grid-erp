import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Package } from './package.entity';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(Package)
    private packageRepository: Repository<Package>,
  ) {}

  async findAll(): Promise<Package[]> {
    return this.packageRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Package> {
    const pkg = await this.packageRepository.findOne({ where: { id } });
    if (!pkg) {
      throw new NotFoundException('Pacote não encontrado');
    }
    return pkg;
  }

  async findByServiceType(serviceType: string): Promise<Package[]> {
    const packages = await this.packageRepository.find({
      where: { isActive: true },
    });
    
    return packages.filter(pkg => {
      if (!pkg.rules?.triggerServices) return false;
      return pkg.rules.triggerServices.includes(serviceType);
    });
  }

  async create(pkgData: Partial<Package>): Promise<Package> {
    const pkg = this.packageRepository.create(pkgData);
    return this.packageRepository.save(pkg);
  }

  async update(id: string, pkgData: Partial<Package>): Promise<Package> {
    const pkg = await this.findOne(id);
    Object.assign(pkg, pkgData);
    return this.packageRepository.save(pkg);
  }

  async remove(id: string): Promise<void> {
    const pkg = await this.findOne(id);
    pkg.isActive = false;
    await this.packageRepository.save(pkg);
  }
}
