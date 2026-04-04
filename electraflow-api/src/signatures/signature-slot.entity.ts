import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

/**
 * SignatureSlot — Biblioteca centralizada de assinaturas
 * Cada registro é uma "assinatura reutilizável" que pode ser vinculada a qualquer documento.
 * 
 * Exemplos:
 *  - Diretor Técnico (scope: company)
 *  - Engenheiro de Campo (scope: employee, referenceId: employee.id)
 *  - Cliente MRV - Eng. Marcos (scope: client, referenceId: client.id)
 *  - Testemunha (scope: witness)
 */
@Entity('signature_slots')
export class SignatureSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  label: string;                          // "Diretor Técnico", "Eng. Marcos", "Testemunha Padrão"

  @Column({ nullable: true })
  signerName: string;                     // Nome de quem assina

  @Column({ nullable: true })
  signerRole: string;                     // Cargo: "Diretor Técnico", "Engenheiro Civil"

  @Column({ nullable: true })
  signerDocument: string;                 // CPF/CNPJ do signatário

  @Column({ nullable: true })
  imageUrl: string;                       // Path/URL da imagem escaneada

  @Column({ default: 'company' })
  scope: string;                          // 'company' | 'client' | 'employee' | 'witness'

  @Column({ nullable: true })
  referenceId: string;                    // ID do client/employee vinculado (null = empresa)

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;                     // Assinatura padrão para este scope

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
