import { Controller, Post, Body, Get, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;
}

class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  role?: string;
}

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  // Login: bcrypt já é lento por natureza — proteção natural contra brute-force.
  // Throttle aqui causava 429 em mobile e ao tentar múltiplas vezes seguidas.
  @SkipThrottle()
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

  @SkipThrottle()
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

  // ═══ UNIFIED LOGIN ═══════════════════════════════════════════════════════

  @SkipThrottle()
  @Post('unified-login')
  @ApiOperation({ summary: 'Login unificado - retorna todos os portais disponíveis' })
  async unifiedLogin(@Body() loginDto: LoginDto) {
    return this.authService.unifiedLogin(loginDto.email, loginDto.password);
  }

  // ═══ REFRESH TOKEN ════════════════════════════════════════════════════════

  @SkipThrottle()
  @Post('refresh')
  @ApiOperation({ summary: 'Renovar access token usando refresh token' })
  async refresh(@Body() body: { refresh_token: string }) {
    if (!body.refresh_token) {
      throw new UnauthorizedException('refresh_token é obrigatório');
    }
    return this.authService.refreshAccessToken(body.refresh_token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout — revoga o refresh token' })
  async logout(@Request() req) {
    await this.authService.revokeRefreshToken(req.user.userId || req.user.sub);
    return { message: 'Logout realizado com sucesso.' };
  }
}
