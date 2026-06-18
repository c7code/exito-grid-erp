import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Verificação completa de saúde da aplicação' })
  async check() {
    const pkg = require('../../package.json');

    const result = await this.health.check([
      // Verifica conexão com o banco PostgreSQL/Supabase
      () => this.db.pingCheck('database', { timeout: 5000 }),

      // Verifica uso de memória (heap < 512MB)
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),

      // Verifica espaço em disco (> 10% livre)
      () => this.disk.checkStorage('disk', {
        path: process.platform === 'win32' ? 'C:\\' : '/',
        thresholdPercent: 0.9, // alerta se > 90% usado
      }),
    ]);

    return {
      ...result,
      info: {
        ...result.info,
        version: pkg.version,
        node: process.version,
        uptime: `${Math.floor(process.uptime())}s`,
        deployedAt: process.env.RAILWAY_DEPLOYMENT_ID
          ? new Date().toISOString()
          : undefined,
        environment: process.env.NODE_ENV || 'development',
      },
    };
  }

  @Get('simple')
  @ApiOperation({ summary: 'Health check simples (sem verificação de dependências)' })
  simple() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: require('../../package.json').version,
    };
  }
}
