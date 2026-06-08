import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LaudoAtendimento } from './laudo.entity';
import { LaudosService } from './laudos.service';
import { LaudosController } from './laudos.controller';
import { LaudosPublicController } from './laudos-public.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LaudoAtendimento])],
  providers: [LaudosService],
  controllers: [LaudosController, LaudosPublicController],
  exports: [LaudosService],
})
export class LaudosModule {}
