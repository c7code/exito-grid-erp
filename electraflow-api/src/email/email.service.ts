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
            this.logger.warn(`[SIMULAÇÃO] Convite enviado para ${email} (SMTP não configurado — senha NÃO logada por segurança)`);
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

    async sendPasswordResetEmail(email: string, name: string, resetLink: string): Promise<boolean> {
        if (!this.transporter) {
            this.logger.warn(`[SIMULAÇÃO] E-mail de redefinição de senha enviado para ${email} (SMTP não configurado)`);
            return false;
        }

        const fromEmail = this.configService.get('SMTP_FROM', this.configService.get('SMTP_USER'));
        const appName = 'ElectraFlow ERP';

        try {
            await this.transporter.sendMail({
                from: `"${appName}" <${fromEmail}>`,
                to: email,
                subject: `${appName} — Redefinição de senha`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e293b, #334155); padding: 30px; border-radius: 12px; text-align: center;">
              <h1 style="color: #f59e0b; margin: 0;">⚡ ElectraFlow ERP</h1>
              <p style="color: #94a3b8; margin-top: 8px;">Redefinição de Senha</p>
            </div>
            
            <div style="padding: 30px 0;">
              <h2 style="color: #1e293b;">Olá, ${name}!</h2>
              <p style="color: #475569; font-size: 16px;">
                Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #1e293b; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                  Redefinir Senha
                </a>
              </div>
              
              <p style="color: #64748b; font-size: 14px;">
                Se você não solicitou esta redefinição, ignore este e-mail. O link expira em 1 hora.
              </p>
              
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 20px;">
                <p style="color: #64748b; font-size: 12px; margin: 0;">
                  Se o botão não funcionar, copie e cole este link no navegador:<br/>
                  <a href="${resetLink}" style="color: #f59e0b; word-break: break-all;">${resetLink}</a>
                </p>
              </div>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
              <p>Este é um e-mail automático do ElectraFlow ERP. Não responda.</p>
            </div>
          </div>
        `,
            });

            this.logger.log(`E-mail de redefinição de senha enviado para ${email}`);
            return true;
        } catch (error) {
            this.logger.error(`Erro ao enviar e-mail de redefinição para ${email}: ${error.message}`);
            return false;
        }
    }

    async sendProposalNotification(
        email: string,
        name: string,
        proposalNumber: string,
        proposalValue: string,
        link: string,
    ): Promise<boolean> {
        if (!this.transporter) {
            this.logger.warn(`[SIMULAÇÃO] Notificação de proposta enviada para ${email} (SMTP não configurado)`);
            return false;
        }

        const fromEmail = this.configService.get('SMTP_FROM', this.configService.get('SMTP_USER'));
        const appName = 'ElectraFlow ERP';

        try {
            await this.transporter.sendMail({
                from: `"${appName}" <${fromEmail}>`,
                to: email,
                subject: `${appName} — Nova Proposta #${proposalNumber}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e293b, #334155); padding: 30px; border-radius: 12px; text-align: center;">
              <h1 style="color: #f59e0b; margin: 0;">⚡ ElectraFlow ERP</h1>
              <p style="color: #94a3b8; margin-top: 8px;">Nova Proposta Comercial</p>
            </div>
            
            <div style="padding: 30px 0;">
              <h2 style="color: #1e293b;">Olá, ${name}!</h2>
              <p style="color: #475569; font-size: 16px;">
                Uma nova proposta comercial foi elaborada para você:
              </p>
              
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 8px 0; color: #334155;">
                  <strong>Proposta Nº:</strong> ${proposalNumber}
                </p>
                <p style="margin: 8px 0; color: #334155;">
                  <strong>Valor:</strong> 
                  <span style="color: #f59e0b; font-size: 20px; font-weight: bold;">R$ ${proposalValue}</span>
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${link}" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #1e293b; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                  Ver Proposta
                </a>
              </div>
              
              <p style="color: #64748b; font-size: 14px;">
                Entre em contato conosco caso tenha dúvidas sobre a proposta.
              </p>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
              <p>Este é um e-mail automático do ElectraFlow ERP. Não responda.</p>
            </div>
          </div>
        `,
            });

            this.logger.log(`Notificação de proposta #${proposalNumber} enviada para ${email}`);
            return true;
        } catch (error) {
            this.logger.error(`Erro ao enviar notificação de proposta para ${email}: ${error.message}`);
            return false;
        }
    }

    async sendTaskNotification(
        email: string,
        name: string,
        taskTitle: string,
        taskDescription: string,
        dueDate: string,
        link: string,
    ): Promise<boolean> {
        if (!this.transporter) {
            this.logger.warn(`[SIMULAÇÃO] Notificação de tarefa enviada para ${email} (SMTP não configurado)`);
            return false;
        }

        const fromEmail = this.configService.get('SMTP_FROM', this.configService.get('SMTP_USER'));
        const appName = 'ElectraFlow ERP';

        try {
            await this.transporter.sendMail({
                from: `"${appName}" <${fromEmail}>`,
                to: email,
                subject: `${appName} — Nova Tarefa Atribuída: ${taskTitle}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e293b, #334155); padding: 30px; border-radius: 12px; text-align: center;">
              <h1 style="color: #f59e0b; margin: 0;">⚡ ElectraFlow ERP</h1>
              <p style="color: #94a3b8; margin-top: 8px;">Nova Tarefa Atribuída</p>
            </div>
            
            <div style="padding: 30px 0;">
              <h2 style="color: #1e293b;">Olá, ${name}!</h2>
              <p style="color: #475569; font-size: 16px;">
                Uma nova tarefa foi atribuída a você:
              </p>
              
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 8px 0; color: #334155;">
                  <strong>📋 Tarefa:</strong> ${taskTitle}
                </p>
                <p style="margin: 8px 0; color: #334155;">
                  <strong>📝 Descrição:</strong> ${taskDescription || 'Sem descrição'}
                </p>
                <p style="margin: 8px 0; color: #334155;">
                  <strong>📅 Prazo:</strong> 
                  <span style="color: #ef4444; font-weight: bold;">${dueDate}</span>
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${link}" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #1e293b; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                  Ver Tarefa
                </a>
              </div>
              
              <p style="color: #64748b; font-size: 14px;">
                ⏰ Lembre-se de concluir a tarefa antes do prazo estabelecido.
              </p>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
              <p>Este é um e-mail automático do ElectraFlow ERP. Não responda.</p>
            </div>
          </div>
        `,
            });

            this.logger.log(`Notificação de tarefa "${taskTitle}" enviada para ${email}`);
            return true;
        } catch (error) {
            this.logger.error(`Erro ao enviar notificação de tarefa para ${email}: ${error.message}`);
            return false;
        }
    }
}
