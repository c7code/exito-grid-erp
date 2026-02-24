import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface NuvemFiscalConfig {
    clientId: string;
    clientSecret: string;
    sandbox: boolean;
}

@Injectable()
export class NuvemFiscalService {
    private readonly logger = new Logger(NuvemFiscalService.name);
    private token: string | null = null;
    private tokenExpiry: number | null = null;
    private readonly tokenUrl = 'https://auth.nuvemfiscal.com.br/oauth/token';

    // ═══════════════════════════════════════════════════════════════
    // AUTH — OAuth 2.0 Client Credentials
    // ═══════════════════════════════════════════════════════════════

    private getBaseUrl(sandbox: boolean): string {
        return sandbox
            ? 'https://api.sandbox.nuvemfiscal.com.br'
            : 'https://api.nuvemfiscal.com.br';
    }

    async getToken(config: NuvemFiscalConfig): Promise<string> {
        // Reutilizar token se ainda válido
        if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.token;
        }

        this.logger.log('Obtendo novo token OAuth2 da Nuvem Fiscal...');

        const params = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: config.clientId,
            client_secret: config.clientSecret,
            scope: 'empresa cep cnpj nfe nfse conta',
        });

        try {
            const { data } = await axios.post(this.tokenUrl, params.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            this.token = data.access_token;
            // Renovar 5 minutos antes de expirar
            this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

            this.logger.log('Token obtido com sucesso');
            return this.token;
        } catch (error) {
            this.logger.error('Erro ao obter token:', error?.response?.data || error.message);
            throw new Error('Falha na autenticação com a Nuvem Fiscal. Verifique Client ID e Client Secret.');
        }
    }

    private async request(
        method: string,
        endpoint: string,
        config: NuvemFiscalConfig,
        body?: any,
        responseType: 'json' | 'text' | 'arraybuffer' = 'json',
    ): Promise<any> {
        const token = await this.getToken(config);
        const baseUrl = this.getBaseUrl(config.sandbox);

        const reqConfig: any = {
            method,
            url: `${baseUrl}${endpoint}`,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            responseType,
        };
        if (body) reqConfig.data = body;

        try {
            const { data } = await axios(reqConfig);
            return data;
        } catch (error) {
            const errData = error?.response?.data;
            this.logger.error(`Nuvem Fiscal ${method} ${endpoint} error:`, errData || error.message);
            throw {
                statusCode: error?.response?.status,
                message: errData?.error?.message || errData?.message || error.message,
                detail: errData,
            };
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // EMPRESAS
    // ═══════════════════════════════════════════════════════════════

    async cadastrarEmpresa(config: NuvemFiscalConfig, empresaData: any) {
        return this.request('POST', '/empresas', config, empresaData);
    }

    async consultarEmpresa(config: NuvemFiscalConfig, cpfCnpj: string) {
        return this.request('GET', `/empresas/${cpfCnpj}`, config);
    }

    async alterarEmpresa(config: NuvemFiscalConfig, cpfCnpj: string, data: any) {
        return this.request('PUT', `/empresas/${cpfCnpj}`, config, data);
    }

    // ═══════════════════════════════════════════════════════════════
    // CERTIFICADO DIGITAL
    // ═══════════════════════════════════════════════════════════════

    async cadastrarCertificado(
        config: NuvemFiscalConfig,
        cpfCnpj: string,
        certificadoBase64: string,
        password: string,
    ) {
        return this.request('PUT', `/empresas/${cpfCnpj}/certificado`, config, {
            certificado: certificadoBase64,
            password,
        });
    }

    async cadastrarCertificadoFromFile(
        config: NuvemFiscalConfig,
        cpfCnpj: string,
        filePath: string,
        password: string,
    ) {
        const absolutePath = path.resolve(filePath);
        if (!fs.existsSync(absolutePath)) {
            throw new Error(`Arquivo do certificado não encontrado: ${absolutePath}`);
        }
        const fileBuffer = fs.readFileSync(absolutePath);
        const base64 = fileBuffer.toString('base64');
        return this.cadastrarCertificado(config, cpfCnpj, base64, password);
    }

    // ═══════════════════════════════════════════════════════════════
    // CONFIGURAÇÃO NF-e / NFS-e
    // ═══════════════════════════════════════════════════════════════

    async configurarNfe(config: NuvemFiscalConfig, cpfCnpj: string, nfeConfig: any) {
        return this.request('PUT', `/empresas/${cpfCnpj}/nfe`, config, nfeConfig);
    }

    async configurarNfse(config: NuvemFiscalConfig, cpfCnpj: string, nfseConfig: any) {
        return this.request('PUT', `/empresas/${cpfCnpj}/nfse`, config, nfseConfig);
    }

    // ═══════════════════════════════════════════════════════════════
    // NF-e (MATERIAL)
    // ═══════════════════════════════════════════════════════════════

    async emitirNfe(config: NuvemFiscalConfig, nfeData: any) {
        return this.request('POST', '/nfe', config, nfeData);
    }

    async consultarNfe(config: NuvemFiscalConfig, id: string) {
        return this.request('GET', `/nfe/${id}`, config);
    }

    async listarNfe(config: NuvemFiscalConfig, cpfCnpj: string, ambiente = 'homologacao') {
        return this.request('GET', `/nfe?cpf_cnpj=${cpfCnpj}&ambiente=${ambiente}&$top=50`, config);
    }

    async cancelarNfe(config: NuvemFiscalConfig, id: string, justificativa: string) {
        return this.request('POST', `/nfe/${id}/cancelamento`, config, { justificativa });
    }

    async downloadXmlNfe(config: NuvemFiscalConfig, id: string): Promise<string> {
        const token = await this.getToken(config);
        const baseUrl = this.getBaseUrl(config.sandbox);
        const { data } = await axios.get(`${baseUrl}/nfe/${id}/xml`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'text',
        });
        return data;
    }

    async downloadPdfNfe(config: NuvemFiscalConfig, id: string): Promise<Buffer> {
        const token = await this.getToken(config);
        const baseUrl = this.getBaseUrl(config.sandbox);
        const { data } = await axios.get(`${baseUrl}/nfe/${id}/pdf`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'arraybuffer',
        });
        return data;
    }

    // ═══════════════════════════════════════════════════════════════
    // NFS-e (SERVIÇO)
    // ═══════════════════════════════════════════════════════════════

    async emitirNfse(config: NuvemFiscalConfig, nfseData: any) {
        return this.request('POST', '/nfse/dps', config, nfseData);
    }

    async consultarNfse(config: NuvemFiscalConfig, id: string) {
        return this.request('GET', `/nfse/${id}`, config);
    }

    async listarNfse(config: NuvemFiscalConfig, cpfCnpj: string, ambiente = 'homologacao') {
        return this.request('GET', `/nfse?cpf_cnpj=${cpfCnpj}&ambiente=${ambiente}&$top=50`, config);
    }

    async cancelarNfse(config: NuvemFiscalConfig, id: string, justificativa: string) {
        return this.request('POST', `/nfse/${id}/cancelamento`, config, { justificativa });
    }

    async downloadXmlNfse(config: NuvemFiscalConfig, id: string): Promise<string> {
        const token = await this.getToken(config);
        const baseUrl = this.getBaseUrl(config.sandbox);
        const { data } = await axios.get(`${baseUrl}/nfse/${id}/xml`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'text',
        });
        return data;
    }

    async downloadPdfNfse(config: NuvemFiscalConfig, id: string): Promise<Buffer> {
        const token = await this.getToken(config);
        const baseUrl = this.getBaseUrl(config.sandbox);
        const { data } = await axios.get(`${baseUrl}/nfse/${id}/pdf`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'arraybuffer',
        });
        return data;
    }

    // ═══════════════════════════════════════════════════════════════
    // UTILITÁRIOS
    // ═══════════════════════════════════════════════════════════════

    async consultarCotas(config: NuvemFiscalConfig) {
        return this.request('GET', '/conta/cotas', config);
    }

    async statusSefaz(config: NuvemFiscalConfig, cpfCnpj: string, ambiente = 'homologacao') {
        return this.request('GET', `/nfe/sefaz/status?cpf_cnpj=${cpfCnpj}&ambiente=${ambiente}`, config);
    }

    async cidadesAtendidasNfse(config: NuvemFiscalConfig) {
        return this.request('GET', '/nfse/cidades', config);
    }

    async consultarCep(config: NuvemFiscalConfig, cep: string) {
        return this.request('GET', `/cep/${cep}`, config);
    }

    async consultarCnpj(config: NuvemFiscalConfig, cnpj: string) {
        return this.request('GET', `/cnpj/${cnpj}`, config);
    }
}
