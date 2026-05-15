import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PartnerJwtStrategy extends PassportStrategy(Strategy, 'partner-jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', 'electraflow-secret-key'),
    });
  }

  async validate(payload: any) {
    if (payload.role !== 'partner') {
      throw new UnauthorizedException('Acesso restrito ao portal do parceiro');
    }
    return {
      consultantId: payload.consultantId,
      email: payload.email,
      role: 'partner',
    };
  }
}
