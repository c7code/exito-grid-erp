import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rule, RuleCondition, RuleAction } from './rule.entity';

@Injectable()
export class RulesService {
  constructor(
    @InjectRepository(Rule)
    private ruleRepository: Repository<Rule>,
  ) {}

  async findAll(): Promise<Rule[]> {
    return this.ruleRepository.find({
      where: { isActive: true },
      order: { priority: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Rule> {
    const rule = await this.ruleRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException('Regra não encontrada');
    }
    return rule;
  }

  async evaluate(context: any): Promise<any[]> {
    const rules = await this.findAll();
    const suggestions = [];

    for (const rule of rules) {
      const matches = this.evaluateConditions(rule.conditions, context);
      if (matches) {
        for (const action of rule.actions) {
          suggestions.push({
            ruleId: rule.id,
            ruleName: rule.name,
            action: action.type,
            params: action.params,
            message: this.formatMessage(rule.messageTemplate, context),
          });
        }
      }
    }

    return suggestions;
  }

  private evaluateConditions(conditions: any[], context: any): boolean {
    return conditions.every(condition => {
      const value = context[condition.field];
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'not_equals':
          return value !== condition.value;
        case 'greater_than':
          return value > condition.value;
        case 'less_than':
          return value < condition.value;
        case 'contains':
          return value?.includes(condition.value);
        case 'in':
          return condition.value?.includes(value);
        default:
          return false;
      }
    });
  }

  private formatMessage(template: string, context: any): string {
    if (!template) return '';
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => context[key] || match);
  }

  async create(ruleData: Partial<Rule>): Promise<Rule> {
    const rule = this.ruleRepository.create(ruleData);
    return this.ruleRepository.save(rule);
  }

  async update(id: string, ruleData: Partial<Rule>): Promise<Rule> {
    const rule = await this.findOne(id);
    Object.assign(rule, ruleData);
    return this.ruleRepository.save(rule);
  }

  async remove(id: string): Promise<void> {
    const rule = await this.findOne(id);
    rule.isActive = false;
    await this.ruleRepository.save(rule);
  }
}
