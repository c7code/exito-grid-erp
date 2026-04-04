import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SignatureSlot } from './signature-slot.entity';
import { DocumentSignature } from './document-signature.entity';

@Injectable()
export class SignaturesService {
  private readonly logger = new Logger(SignaturesService.name);

  constructor(
    @InjectRepository(SignatureSlot)
    private slotRepo: Repository<SignatureSlot>,
    @InjectRepository(DocumentSignature)
    private docSigRepo: Repository<DocumentSignature>,
  ) {}

  // ═══ SIGNATURE SLOTS (Biblioteca) ══════════════════════════════════════════

  async findAllSlots(): Promise<SignatureSlot[]> {
    return this.slotRepo.find({ order: { scope: 'ASC', sortOrder: 'ASC', label: 'ASC' } });
  }

  async findSlotsByScope(scope: string): Promise<SignatureSlot[]> {
    return this.slotRepo.find({ where: { scope }, order: { sortOrder: 'ASC', label: 'ASC' } });
  }

  async findSlotById(id: string): Promise<SignatureSlot> {
    const slot = await this.slotRepo.findOne({ where: { id } });
    if (!slot) throw new NotFoundException('Assinatura não encontrada');
    return slot;
  }

  async createSlot(data: Partial<SignatureSlot>): Promise<SignatureSlot> {
    // If setting as default, unset other defaults for same scope
    if (data.isDefault) {
      await this.slotRepo.update(
        { scope: data.scope || 'company', isDefault: true },
        { isDefault: false },
      );
    }
    const slot = this.slotRepo.create(data);
    const saved = await this.slotRepo.save(slot);
    this.logger.log(`Assinatura criada: ${saved.label} (${saved.scope})`);
    return saved;
  }

  async updateSlot(id: string, data: Partial<SignatureSlot>): Promise<SignatureSlot> {
    const slot = await this.findSlotById(id);
    if (data.isDefault && !slot.isDefault) {
      await this.slotRepo.update(
        { scope: data.scope || slot.scope, isDefault: true },
        { isDefault: false },
      );
    }
    Object.assign(slot, data);
    return this.slotRepo.save(slot);
  }

  async deleteSlot(id: string): Promise<void> {
    const slot = await this.findSlotById(id);
    await this.slotRepo.softRemove(slot);
    this.logger.log(`Assinatura removida: ${slot.label}`);
  }

  // ═══ DOCUMENT SIGNATURES (Vínculo doc ↔ assinatura) ════════════════════════

  async getDocumentSignatures(documentType: string, documentId: string): Promise<DocumentSignature[]> {
    return this.docSigRepo.find({
      where: { documentType, documentId },
      relations: ['signatureSlot'],
      order: { slotPosition: 'ASC' },
    });
  }

  async setDocumentSignature(data: {
    documentType: string;
    documentId: string;
    slotPosition: string;
    signatureSlotId: string;
    overrideSignerName?: string;
    overrideSignerRole?: string;
  }): Promise<DocumentSignature> {
    // Upsert — if exists for this doc+slot, update; else create
    let existing = await this.docSigRepo.findOne({
      where: {
        documentType: data.documentType,
        documentId: data.documentId,
        slotPosition: data.slotPosition,
      },
    });

    if (existing) {
      Object.assign(existing, data);
      return this.docSigRepo.save(existing);
    }

    const docSig = this.docSigRepo.create(data);
    return this.docSigRepo.save(docSig);
  }

  async removeDocumentSignature(id: string): Promise<void> {
    await this.docSigRepo.delete(id);
  }

  /**
   * Resolve signatures for a document.
   * Returns a map: slotPosition → { imageUrl, signerName, signerRole, signerDocument }
   * Falls back to default signatures if no specific binding exists.
   */
  async resolveSignatures(
    documentType: string,
    documentId: string,
    slotPositions: string[] = ['contratada', 'contratante', 'testemunha'],
  ): Promise<Record<string, { imageUrl?: string; signerName?: string; signerRole?: string; signerDocument?: string }>> {
    const result: Record<string, any> = {};

    // Get document-specific bindings
    const docSigs = await this.getDocumentSignatures(documentType, documentId);
    const docSigMap = new Map(docSigs.map(ds => [ds.slotPosition, ds]));

    // Get default signatures
    const defaults = await this.slotRepo.find({ where: { isDefault: true } });
    const defaultByScope = new Map(defaults.map(d => [d.scope, d]));

    for (const pos of slotPositions) {
      const docSig = docSigMap.get(pos);
      if (docSig?.signatureSlot) {
        result[pos] = {
          imageUrl: docSig.signatureSlot.imageUrl,
          signerName: docSig.overrideSignerName || docSig.signatureSlot.signerName,
          signerRole: docSig.overrideSignerRole || docSig.signatureSlot.signerRole,
          signerDocument: docSig.signatureSlot.signerDocument,
        };
      } else {
        // Fallback to defaults based on slot position
        const scopeForPos = pos === 'contratada' ? 'company' : pos === 'contratante' ? 'client' : 'witness';
        const defaultSlot = defaultByScope.get(scopeForPos);
        if (defaultSlot) {
          result[pos] = {
            imageUrl: defaultSlot.imageUrl,
            signerName: defaultSlot.signerName,
            signerRole: defaultSlot.signerRole,
            signerDocument: defaultSlot.signerDocument,
          };
        } else {
          result[pos] = {};
        }
      }
    }

    return result;
  }
}
