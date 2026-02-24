export type UserRole = 'admin' | 'employee' | 'client' | 'commercial' | 'engineer' | 'finance' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  permissions?: string[];
  department?: string;
  position?: string;
  supervisorId?: string;
  supervisor?: User;
  status?: 'active' | 'inactive' | 'pending';
  invitedAt?: string;
  createdAt: string;
}

export type ClientSegment = 'residential' | 'commercial' | 'industrial' | 'condominium';
export type ClientType = 'individual' | 'company';

export interface ClientDocument {
  id: string;
  clientId: string;
  name: string;
  type: string;
  url: string;
  issueDate?: string;
  expiryDate?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  companyName?: string;
  document?: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  segment: ClientSegment;
  type: ClientType;
  address?: string;
  neighborhood?: string;
  number?: string;
  complement?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  stateRegistration?: string;
  hasPortalAccess: boolean;
  notes?: string;
  documents?: ClientDocument[];
  createdAt: string;
}

export type OpportunityStage = 'lead_new' | 'qualification' | 'visit' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | 'execution' | 'completed';
export type OpportunitySource = 'website' | 'whatsapp' | 'referral' | 'social_media' | 'other';

export interface Opportunity {
  id: string;
  title: string;
  stage: OpportunityStage;
  serviceType?: string;
  estimatedValue?: number;
  actualValue?: number;
  probability?: number;
  clientId?: string;
  client?: Client;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  source?: OpportunitySource;
  description?: string;
  lossReason?: string;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  assignedToId?: string;
  createdAt: string;
  updatedAt: string;
}

export type WorkStatus = 'draft' | 'pending_approval' | 'approved' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
export type WorkType = 'residential' | 'commercial' | 'industrial';

export interface Work {
  id: string;
  code: string;
  title: string;
  description?: string;
  client: Client;
  type: WorkType;
  status: WorkStatus;
  address: string;
  city: string;
  state: string;
  estimatedValue: number;
  finalValue?: number;
  startDate?: string;
  estimatedDeadline?: string;
  actualDeadline?: string;
  assignedTo?: User;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  workId?: string;
  work?: Work;
  assignedTo?: User;
  status: TaskStatus;
  priority: TaskPriority;
  type?: string;
  weightPercentage?: number;
  estimatedHours?: number;
  actualHours?: number;
  deadline?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProposalStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';

export interface Proposal {
  id: string;
  code: string;
  title: string;
  opportunity?: Opportunity;
  client: Client;
  items: ProposalItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: ProposalStatus;
  validUntil: string;
  sentAt?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type ProtocolStatus = 'open' | 'pending' | 'in_analysis' | 'requirement' | 'approved' | 'rejected' | 'expired' | 'closed' | 'cancelled';
export type ProtocolType = 'utility' | 'municipal' | 'environmental' | 'other';

export type ProtocolEventType =
  | 'status_change'
  | 'comment'
  | 'document_attached'
  | 'external_update'
  | 'sla_warning'
  | 'requirement_received';

export const ProtocolEventTypes: Record<string, ProtocolEventType> = {
  STATUS_CHANGE: 'status_change',
  COMMENT: 'comment',
  DOCUMENT_ATTACHED: 'document_attached',
  EXTERNAL_UPDATE: 'external_update',
  SLA_WARNING: 'sla_warning',
  REQUIREMENT_RECEIVED: 'requirement_received',
};

export interface ProtocolAttachment {
  id: string;
  name: string;
  url: string;
  mimeType?: string;
  size?: number;
  eventId: string;
  createdAt: string;
}

export interface ProtocolEvent {
  id: string;
  protocolId: string;
  type: ProtocolEventType;
  description: string;
  metadata?: any;
  progress?: number;
  attachments?: ProtocolAttachment[];
  userId?: string;
  user?: User;
  createdAt: string;
}

export interface Protocol {
  id: string;
  code: string;
  workId: string;
  work: Work;
  concessionaria: string;
  utilityCompany: string;
  protocolNumber?: string;
  status: ProtocolStatus;
  description?: string;
  slaDays?: number;
  remainingDays?: number;
  openedAt?: string;
  respondedAt?: string;
  closedAt?: string;
  requirementDescription?: string;
  requirementDeadline?: string;
  type?: string;
  priority?: string;
  clientId?: string;
  client?: Client;
  taskId?: string;
  task?: Task;
  events?: ProtocolEvent[];
  createdAt: string;
  updatedAt: string;
}

export type DocumentType = 'project' | 'report' | 'art' | 'memorial' | 'photo' | 'contract' | 'invoice' | 'certificate' | 'other';

export interface DocumentFolder {
  id: string;
  name: string;
  workId?: string;
  parentId?: string;
  parent?: DocumentFolder;
  children?: DocumentFolder[];
  documents?: Document[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  name: string;
  fileName: string;
  type: DocumentType;
  url: string;
  mimeType?: string;
  size?: number;
  description?: string;
  workId?: string;
  work?: Work;
  folderId?: string;
  folder?: DocumentFolder;
  proposalId?: string;
  clientId?: string;
  uploadedById?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}


export interface DashboardStats {
  totalWorks: number;
  activeWorks: number;
  pendingTasks: number;
  monthlyRevenue: number;
  opportunitiesCount: number;
  conversionRate: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export type EmployeeRole = 'administrative' | 'operational' | 'engineering';
export type EmployeeStatus = 'active' | 'inactive';
export type EmployeeDocumentType = 'identification' | 'health' | 'safety' | 'other';

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  name: string;
  type: EmployeeDocumentType;
  url: string;
  issueDate?: string;
  expiryDate?: string;
  clientVisible: boolean;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: EmployeeRole;
  specialty?: string;
  status: EmployeeStatus;
  hiredAt?: string;
  documents?: EmployeeDocument[];
  createdAt: string;
  updatedAt: string;
}

// ==================== SUPPLY CHAIN ====================

export type SupplierSegment = 'material' | 'service' | 'both';
export type SupplierStatus = 'active' | 'inactive' | 'blocked';

export interface SupplierContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  isPrimary: boolean;
  supplierId: string;
}

export interface Supplier {
  id: string;
  name: string;
  tradeName?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  segment: SupplierSegment;
  status: SupplierStatus;
  rating: number;
  notes?: string;
  paymentTerms?: string;
  contacts?: SupplierContact[];
  createdAt: string;
  updatedAt: string;
}

export type QuotationStatus = 'draft' | 'sent' | 'received' | 'analyzed' | 'closed';

export interface QuotationItem {
  id: string;
  catalogItemId?: string;
  catalogItem?: any;
  description: string;
  quantity: number;
  unit: string;
  responseItems?: QuotationResponseItem[];
}

export interface QuotationResponseItem {
  id: string;
  quotationItemId: string;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  quotationResponse?: QuotationResponseData;
}

export interface QuotationResponseData {
  id: string;
  supplierId: string;
  supplier?: Supplier;
  status: 'pending' | 'received' | 'selected' | 'rejected';
  receivedAt?: string;
  validUntil?: string;
  deliveryDays?: number;
  paymentTerms?: string;
  notes?: string;
  items?: QuotationResponseItem[];
}

export interface QuotationRequest {
  id: string;
  code: string;
  title: string;
  status: QuotationStatus;
  deadline?: string;
  notes?: string;
  items: QuotationItem[];
  responses?: QuotationResponseData[];
  createdAt: string;
  updatedAt: string;
}

export interface PriceHistoryEntry {
  id: string;
  catalogItemId: string;
  catalogItem?: any;
  supplierId: string;
  supplier?: Supplier;
  unitPrice: number;
  date: string;
  source: 'quotation' | 'manual' | 'import';
  quotationResponseId?: string;
  createdAt: string;
}
