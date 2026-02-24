import { Controller, Post, Body, Get, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

class LoginDto {
  email: string;
  password: string;
}

class RegisterDto {
  name: string;
  email: string;
  password: string;
  role?: string;
}

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('login')
  @ApiOperation({ summary: 'Login do usuário' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return this.authService.login(user);
  }

  @Post('register')
  @ApiOperation({ summary: 'Registro de novo usuário' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.name,
      registerDto.email,
      registerDto.password,
      registerDto.role as any,
    );
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil do usuário logado' })
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }

  // ═══ CLIENT AUTH ══════════════════════════════════════════════════════════

  @Post('client-login')
  @ApiOperation({ summary: 'Login do cliente (Portal)' })
  async clientLogin(@Body() loginDto: LoginDto) {
    const client = await this.authService.validateClient(loginDto.email, loginDto.password);
    if (!client) {
      throw new UnauthorizedException('Credenciais inválidas ou acesso ao portal desabilitado');
    }
    return this.authService.loginClient(client);
  }

  @Get('client-profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil do cliente logado' })
  async getClientProfile(@Request() req) {
    return this.authService.getClientProfile(req.user.userId);
  }
}

