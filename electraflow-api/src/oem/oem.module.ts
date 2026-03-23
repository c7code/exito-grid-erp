import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OemUsina } from './oem-usina.entity';
import { OemPlano } from './oem-plano.entity';
import { OemContrato } from './oem-contrato.entity';
import { OemService } from './oem.service';
import { OemController } from './oem.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([OemUsina, OemPlano, OemContrato]),
    ],
    controllers: [OemController],
    providers: [OemService],
    exports: [OemService],
})
export class OemModule {}
