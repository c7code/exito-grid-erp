import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LaudoAtendimento } from './laudo.entity';
import { LaudosService } from './laudos.service';
import { LaudosController } from './laudos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LaudoAtendimento])],
  providers: [LaudosService],
  controllers: [LaudosController],
  exports: [LaudosService],
})
export class LaudosModule {}
