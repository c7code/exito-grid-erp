import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  findAll(@Query('workId') workId?: string) {
    if (workId) {
      return this.documentsService.findByWork(workId);
    }
    return this.documentsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  findOne(@Param('id') id: string) {
    return this.documentsService.findById(id);
  }

  @Post('upload')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { workId?: string; taskId?: string; category?: string },
  ) {
    return this.documentsService.create({
      name: file.originalname,
      filePath: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      workId: body.workId,
      taskId: body.taskId,
      category: body.category || 'general',
    });
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  remove(@Param('id') id: string) {
    return this.documentsService.delete(id);
  }
}
