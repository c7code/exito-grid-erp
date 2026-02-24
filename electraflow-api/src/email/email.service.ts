import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter;

    constructor(private configService: ConfigService) {
        const smtpHost = this.configService.get('SMTP_HOST');
        const smtpPort = this.configService.get('SMTP_PORT', 587);
        const smtpUser = this.configService.get('SMTP_USER');
        const smtpPass = this.configService.get('SMTP_PASS');

        if (smtpHost && smtpUser) {
            this.transporter = nodemailer.createTransport({
                host: smtpHost,
                port: Number(smtpPort),
                secure: Number(smtpPort) === 465,
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
            });
            this.logger.log('Email service configurado com sucesso');
        } else {
            this.logger.warn('Email service NÃO configurado. Variáveis SMTP_HOST e SMTP_USER são obrigatórias.');
        }
    }

    async sendInviteEmail(email: string, name: string, password: string): Promise<boolean> {
        if (!this.transporter) {
            this.logger.warn(`[SIMULAÇÃO] Convite enviado para ${email} com senha: ${password}`);
            return false;
        }

        const fromEmail = this.configService.get('SMTP_FROM', this.configService.get('SMTP_USER'));
        const appName = 'ElectraFlow ERP';

        try {
            await this.transporter.sendMail({
                from: `"${appName}" <${fromEmail}>`,
                to: email,
                subject: `Bem-vindo ao ${appName} — Suas credenciais de acesso`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e293b, #334155); padding: 30px; border-radius: 12px; text-align: center;">
              <h1 style="color: #f59e0b; margin: 0;">⚡ ElectraFlow ERP</h1>
              <p style="color: #94a3b8; margin-top: 8px;">Sistema de Gestão para Engenharia Elétrica</p>
            </div>
            
            <div style="padding: 30px 0;">
              <h2 style="color: #1e293b;">Olá, ${name}!</h2>
              <p style="color: #475569; font-size: 16px;">
                Você foi convidado para acessar o ElectraFlow ERP. Abaixo estão suas credenciais de acesso:
              </p>
              
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 8px 0; color: #334155;">
                  <strong>E-mail:</strong> ${email}
                </p>
                <p style="margin: 8px 0; color: #334155;">
                  <strong>Senha temporária:</strong> 
                  <code style="background: #1e293b; color: #f59e0b; padding: 4px 12px; border-radius: 4px; font-size: 18px;">${password}</code>
                </p>
              </div>
              
              <p style="color: #64748b; font-size: 14px;">
                ⚠️ Recomendamos que você altere sua senha após o primeiro acesso.
              </p>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
              <p>Este é um e-mail automático do ElectraFlow ERP. Não responda.</p>
            </div>
          </div>
        `,
            });

            this.logger.log(`Convite enviado com sucesso para ${email}`);
            return true;
        } catch (error) {
            this.logger.error(`Erro ao enviar convite para ${email}: ${error.message}`);
            return false;
        }
    }
}
