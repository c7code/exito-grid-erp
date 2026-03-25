import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SinapiController } from './sinapi.controller';
import { SinapiService } from './sinapi.service';
import { SinapiInput } from './entities/sinapi-input.entity';
import { SinapiPrice } from './entities/sinapi-price.entity';
import { SinapiComposition } from './entities/sinapi-composition.entity';
import { SinapiCompositionItem } from './entities/sinapi-composition-item.entity';
import { SinapiCompositionPrice } from './entities/sinapi-composition-price.entity';
import { SinapiConfig } from './entities/sinapi-config.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            SinapiInput,
            SinapiPrice,
            SinapiComposition,
            SinapiCompositionItem,
            SinapiCompositionPrice,
            SinapiConfig,
        ]),
    ],
    controllers: [SinapiController],
    providers: [SinapiService],
    exports: [SinapiService],
})
export class SinapiModule {}
