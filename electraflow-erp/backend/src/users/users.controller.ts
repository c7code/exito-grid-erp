import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService, CreateUserDto, UpdateUserDto } from './users.service';
import { JwtAuthGuard, RolesGuard, ROLES_KEY } from '../auth/jwt-auth.guard';
import { UserRole } from './user.entity';
import { SetMetadata } from '@nestjs/common';

export const RequireRoles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar todos os usuários' })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('employees')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar funcionários' })
  async getEmployees() {
    return this.usersService.findByRole(UserRole.EMPLOYEE);
  }

  @Get(':id')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar novo usuário' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar usuário' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover usuário' })
  async delete(@Param('id') id: string) {
    await this.usersService.delete(id);
    return { message: 'Usuário removido com sucesso' };
  }
}
