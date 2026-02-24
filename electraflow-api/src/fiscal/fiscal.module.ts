import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FiscalController } from './fiscal.controller';
import { FiscalService } from './fiscal.service';
import { NuvemFiscalService } from './nuvem-fiscal.service';
import { FiscalConfig, FiscalInvoice } from './fiscal.entity';
import { InvoiceValueEdit } from './invoice-value-edit.entity';
import { Proposal } from '../proposals/proposal.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([FiscalConfig, FiscalInvoice, InvoiceValueEdit, Proposal]),
        MulterModule.register({
            storage: diskStorage({
                destination: './uploads/certificates',
                filename: (_, file, cb) => {
                    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = file.originalname.split('.').pop();
                    cb(null, `cert-${unique}.${ext}`);
                },
            }),
        }),
    ],
    controllers: [FiscalController],
    providers: [FiscalService, NuvemFiscalService],
    exports: [FiscalService],
})
export class FiscalModule { }
