import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SignatureSlot } from './signature-slot.entity';

/**
 * DocumentSignature — Vínculo entre um documento específico e uma assinatura.
 * 
 * Permite override por documento individual.
 * Ex: Proposta #123 → slot CONTRATADA → assinatura "Diretor Técnico"
 *     Proposta #123 → slot CONTRATANTE → assinatura "Eng. Marcos (MRV)"
 */
@Entity('document_signatures')
export class DocumentSignature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  documentType: string;                   // 'proposal' | 'measurement' | 'service_order' | 'receipt' | 'contract'

  @Column()
  documentId: string;                     // UUID do documento

  @Column()
  slotPosition: string;                   // 'contratada' | 'contratante' | 'testemunha' | 'engenheiro' | 'fiscal'

  @Column({ nullable: true })
  signatureSlotId: string;                // FK para SignatureSlot

  @ManyToOne(() => SignatureSlot, { eager: true, nullable: true })
  @JoinColumn({ name: 'signatureSlotId' })
  signatureSlot: SignatureSlot;

  @Column({ nullable: true })
  overrideSignerName: string;             // Override do nome para este documento

  @Column({ nullable: true })
  overrideSignerRole: string;             // Override do cargo para este documento

  @CreateDateColumn()
  createdAt: Date;
}
