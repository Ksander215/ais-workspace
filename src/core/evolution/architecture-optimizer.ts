/**
 * Architecture optimizer — generates architecture optimization suggestions.
 *
 * @packageDocumentation
 */

import { randomUUID } from 'node:crypto';
import type { EventBus } from '../events/event-bus';
import { EventClassification } from '../events/types';
import type { Timestamp } from '../types';
import { brandEvolutionNodeId } from './types';

/**
 * Architecture optimization suggestion.
 */
export interface ArchOptimizationSuggestion {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly description: string;
  readonly affectedModules: readonly string[];
  readonly estimatedImpact: number;
  readonly estimatedEffort: number;
  readonly risk: number;
  readonly createdAt: Timestamp;
  readonly metadata: Readonly<Record<string, unknown>>;
}

/**
 * Optimizer configuration.
 */
export interface ArchitectureOptimizerConfig {
  readonly maxSuggestions: number;
}\n
/**
 * Cycling suggestion types.
 */
const CYCLING_TYPES: readonly string[] = ['performance', 'maintainability', 'security', 'scalability'];

/**
 * Architecture optimizer.
 */
export class ArchitectureOptimizer {
  private readonly config: ArchitectureOptimizerConfig;
  private readonly eventBus: EventBus | null;
  private readonly suggestions = new Map<string, ArchOptimizationSuggestion>();

  constructor(config: ArchitectureOptimizerConfig, eventBus?: EventBus | null) {
    this.config = config;
    this.eventBus = eventBus ?? null;
  }

  async analyze(modules?: readonly string[]): Promise<readonly ArchOptimizationSuggestion[]> {
    const now: Timestamp = new Date().toISOString();
    const targetModules = modules ?? ['core'];
    const results: ArchOptimizationSuggestion[] = [];

    for (const module of targetModules) {
      if (results.length >= this.config.maxSuggestions) break;

      for (const type of CYCLING_TYPES) {
        if (results.length >= this.config.maxSuggestions) break;

        const id = brandEvolutionNodeId(randomUUID());
        const title = `${type} for ${module}`;
        const description = `Architecture optimization suggestion: ${type} in module ${module}`;
        const estimatedImpact = Math.round((50 + Math.random() * 50) * 100) / 100;

        const suggestion: ArchOptimizationSuggestion = Object.freeze({
          id,
          type,
          title,
          description,
          affectedModules: Object.freeze([...targetModules]),
          estimatedImpact,
          estimatedEffort: Math.ceil(estimatedImpact * 2),
          risk: Math.round(estimatedImpact * 0.3 * 100) / 100,
          createdAt: now,
          metadata: Object.freeze({}),
        });

        this.suggestions.set(id as string, suggestion);
        results.push(suggestion);

        await this.publishEvent({
          eventType: 'evolution.arch.suggested',
          classification: EventClassification.Result,
          nodeId: id,
          type,
        });
      }
    }

    return Object.freeze(results);
  }

  /**
   * Get all generated suggestions.
   */
  getSuggestions(): readonly ArchOptimizationSuggestion[] {
    return Object.freeze([...this.suggestions.values()]);
  }

  /**
   * Publish an event if a bus is attached.
   */
  private async publishEvent(event: {
    eventType: string;
    classification: EventClassification;
    nodeId: string;
    type: string;
  }): Promise<void> {
    if (!this.eventBus) return;
    await this.eventBus.publish(event as never);
  }
}
