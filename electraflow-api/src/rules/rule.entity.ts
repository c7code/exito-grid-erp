import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum RuleCondition {
  SERVICE_TYPE = 'service_type',
  VOLTAGE = 'voltage',
  POWER = 'power',
  CONSUMPTION = 'consumption',
  CLIENT_SEGMENT = 'client_segment',
  HAS_DONATION = 'has_donation',
  HAS_UTILITY = 'has_utility',
  HAS_SPDA = 'has_spda',
  HAS_REPORT = 'has_report',
  DAYS_SINCE_LAST_REPORT = 'days_since_last_report',
  UNITS_COUNT = 'units_count',
  CONCESSIONARIA = 'concessionaria',
}

export enum RuleAction {
  SUGGEST_PACKAGE = 'suggest_package',
  ADD_PROPOSAL_ITEM = 'add_proposal_item',
  CREATE_TASK = 'create_task',
  SEND_MESSAGE = 'send_message',
  OPEN_CHECKLIST = 'open_checklist',
  REQUEST_DOCUMENT = 'request_document',
}

@Entity('rules')
export class Rule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 1 })
  priority: number;

  @Column({ type: 'simple-json' })
  conditions: {
    field: RuleCondition;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
    value: any;
  }[];

  @Column({ type: 'simple-json' })
  actions: {
    type: RuleAction;
    params: any;
  }[];

  @Column({ type: 'text', nullable: true })
  messageTemplate: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
