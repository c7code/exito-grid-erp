import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Client } from '../clients/client.entity';

// ══════════════════════════════════════════════════════════════════
// LAUDO ATENDIMENTO — Atendimentos Técnicos / Laudos Comerciais
// ══════════════════════════════════════════════════════════════════
@Entity('laudo_atendimentos')
export class LaudoAtendimento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ─── Referência ao Cliente (FK → clients.id) ───
  @Column({ nullable: true })
  clientId: string;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  // ─── Referência ao Vendedor/Responsável (FK → users.id) ───
  @Column()
  vendedorId: string;

  // Não criamos @ManyToOne direto para evitar import circular com users
  // A relação é feita via query manual quando necessário

  // ─── Dados do Formulário (JSON) ───
  // Armazena todas as respostas do formulário de laudo/atendimento
  @Column({ type: 'text', nullable: true })
  dados: string; // JSON stringified — usar JSON.parse/stringify

  // ─── Documentos (JSON) ───
  // Array de referências aos arquivos no Storage
  // Formato: [{ fileName, originalName, url, filePath, mimeType, size, uploadedAt }]
  @Column({ type: 'text', nullable: true })
  documentos: string; // JSON stringified

  // ─── Token para link público ───
  @Column({ type: 'varchar', nullable: true, unique: true })
  publicToken: string;

  // ─── Status do Atendimento ───
  @Column({ type: 'varchar', default: 'aberto' })
  status: string; // 'aberto' | 'pendente_cliente' | 'enviado_orcamento' | 'perdido'

  // ─── Referência à Proposta (nulável) ───
  // Preenchida somente quando o orçamento/proposta é gerado
  @Column({ nullable: true })
  proposalId: string;

  // ─── Metadados ───
  @Column({ type: 'text', nullable: true })
  observacoes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
