import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseStorageService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(SupabaseStorageService.name);
  private readonly BUCKET = 'documentos';

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_SERVICE_KEY');

    if (!url || !key) {
      this.logger.warn(
        '⚠️  SUPABASE_URL ou SUPABASE_SERVICE_KEY não configurados. Upload para Supabase desabilitado.',
      );
    }

    this.supabase = createClient(url || '', key || '');
  }

  /**
   * Upload de arquivo para o Supabase Storage.
   * @returns URL pública do arquivo
   */
  async upload(
    storagePath: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    const { error } = await this.supabase.storage
      .from(this.BUCKET)
      .upload(storagePath, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Erro ao fazer upload: ${error.message}`);
      throw new Error(`Erro no upload para Supabase Storage: ${error.message}`);
    }

    // Gerar URL pública
    const { data } = this.supabase.storage
      .from(this.BUCKET)
      .getPublicUrl(storagePath);

    this.logger.log(`✅ Upload concluído: ${storagePath}`);
    return data.publicUrl;
  }

  /**
   * Remove arquivo do Supabase Storage.
   */
  async delete(storagePath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.BUCKET)
      .remove([storagePath]);

    if (error) {
      this.logger.warn(`⚠️ Erro ao deletar do storage: ${error.message}`);
    } else {
      this.logger.log(`🗑️ Arquivo removido do storage: ${storagePath}`);
    }
  }

  /**
   * Retorna a URL pública de um arquivo.
   */
  getPublicUrl(storagePath: string): string {
    const { data } = this.supabase.storage
      .from(this.BUCKET)
      .getPublicUrl(storagePath);
    return data.publicUrl;
  }

  /**
   * Verifica se o Supabase Storage está configurado.
   */
  isConfigured(): boolean {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_SERVICE_KEY');
    return !!(url && key);
  }
}
