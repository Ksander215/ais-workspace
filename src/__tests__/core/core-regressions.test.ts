/**
 * Regression tests for the logical defects found in the AIS core audit.
 *
 * Every test here failed before the fix.
 */
import { describe, it, expect, vi } from 'vitest';

import { ContextEngine } from '../../core/context/context-engine.js';
import { InProcessEventBus } from '../../core/events/event-bus.js';
import { ContextPolicyManager } from '../../core/context/policies.js';
import { ContextSource, ContextPriority } from '../../core/context/types.js';
import type { ContextSourceProvider } from '../../core/context/context-builder.js';
import { WorkflowScheduler } from '../../core/workflow/scheduler.js';
import { StageType } from '../../core/workflow/types.js';
import { KnowledgeVersionManager } from '../../core/knowledge/versioning.js';
import { CostEngine } from '../../core/ai-provider/cost-engine.js';
import type { ModelDescriptor, ModelId, ProviderId } from '../../core/ai-provider/types.js';

function makeProvider(
  source: ContextSource,
  entries: Array<{ key: string; value: unknown; priority?: ContextPriority }>,
): ContextSourceProvider {
  return {
    source,
    async getEntries() {
      return entries.map(e => ({
        key: e.key,
        value: e.value,
        source,
        priority: e.priority ?? ContextPriority.Normal,
        createdAt: new Date().toISOString(),
      }));
    },
  };
}

describe('core regression: context policies', () => {
  it('evicts the LOW priority entry first', () => {
    const policy = new ContextPolicyManager({
      maxContextSizeBytes: 10_000,
      maxEntriesPerContext: 100,
      defaultTtlMs: 3_600_000,
      compressionThresholdBytes: 1024 * 1024,
      enablePriority: true,
      enableExpiration: false,
      enableMerge: true,
      mergeConflictStrategy: 'priority-wins',
    });

    const now = Date.now();
    const context: any = {
      contextId: 'ctx',
      version: '1',
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
      entries: new Map([
        ['crit', { key: 'crit', value: 1, source: ContextSource.Runtime, priority: 100, createdAt: new Date(now).toISOString() }],
        ['low', { key: 'low', value: 2, source: ContextSource.Runtime, priority: 10, createdAt: new Date(now - 60_000).toISOString() }],
      ]),
      sizeBytes: 100,
    };

    expect(policy.selectEvictionCandidate(context)).toBe('low');
  });

  it('evicts the older entry when priorities are equal', () => {
    const policy = new ContextPolicyManager({
      maxContextSizeBytes: 10_000,
      maxEntriesPerContext: 100,
      defaultTtlMs: 3_600_000,
      compressionThresholdBytes: 1024 * 1024,
      enablePriority: true,
      enableExpiration: false,
      enableMerge: true,
      mergeConflictStrategy: 'priority-wins',
    });

    const now = Date.now();
    const context: any = {
      contextId: 'ctx',
      version: '1',
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
      entries: new Map([
        ['new', { key: 'new', value: 1, source: ContextSource.Runtime, priority: 50, createdAt: new Date(now).toISOString() }],
        ['old', { key: 'old', value: 2, source: ContextSource.Runtime, priority: 50, createdAt: new Date(now - 60_000).toISOString() }],
      ]),
      sizeBytes: 100,
    };

    expect(policy.selectEvictionCandidate(context)).toBe('old');
  });
});

describe('core regression: context engine updates', () => {
  it('does not add an entry that the policy rejects', async () => {
    const engine = new ContextEngine({
      policyConfig: { maxContextSizeBytes: 200 },
    });
    engine.registerProvider(makeProvider(ContextSource.Runtime, []));
    const ctx = await engine.buildContext();

    const updated = await engine.updateContext(ctx.contextId, [
      {
        key: 'big',
        value: 'x'.repeat(500),
        source: ContextSource.Runtime,
        priority: ContextPriority.Normal,
        createdAt: new Date().toISOString(),
      },
    ]);

    expect(updated.entries.has('big')).toBe(false);
  });

  it('does not overwrite an existing key when merging is disabled', async () => {
    const engine = new ContextEngine({ policyConfig: { enableMerge: false } });
    engine.registerProvider(makeProvider(ContextSource.Runtime, [{ key: 'a', value: 'v1' }]));
    const ctx = await engine.buildContext();

    const updated = await engine.updateContext(ctx.contextId, [
      {
        key: 'a',
        value: 'v2',
        source: ContextSource.Runtime,
        priority: ContextPriority.Normal,
        createdAt: new Date().toISOString(),
      },
    ]);

    expect(updated.entries.get('a')!.value).toBe('v1');
  });

  it('keeps the entry added in the same call (does not evict itself)', async () => {
    const engine = new ContextEngine({ policyConfig: { maxEntriesPerContext: 1 } });
    engine.registerProvider(makeProvider(ContextSource.Runtime, []));
    const ctx = await engine.buildContext();

    const updated = await engine.updateContext(ctx.contextId, [
      {
        key: 'a',
        value: 'v',
        source: ContextSource.Runtime,
        priority: ContextPriority.Normal,
        createdAt: new Date().toISOString(),
      },
    ]);

    expect(updated.entries.has('a')).toBe(true);
  });

  it('reports source and priority of the evicted entry', async () => {
    const bus = new InProcessEventBus();
    const engine = new ContextEngine({
      eventBus: bus,
      policyConfig: { maxEntriesPerContext: 1 },
    });
    engine.registerProvider(
      makeProvider(ContextSource.User, [{ key: 'old', value: 'v', priority: ContextPriority.High }]),
    );
    const ctx = await engine.buildContext();

    await engine.updateContext(ctx.contextId, [
      {
        key: 'new',
        value: 'v2',
        source: ContextSource.Runtime,
        priority: ContextPriority.Normal,
        createdAt: new Date().toISOString(),
      },
    ]);

    const evicted = bus.getLog().find(e => e.eventType === 'ContextEntryEvicted');
    expect(evicted).toBeDefined();
    expect(evicted!.payload.source).toBe(ContextSource.User);
    expect(evicted!.payload.priority).toBe(ContextPriority.High);
  });
});

describe('core regression: workflow scheduler', () => {
  it('warns about stages that cannot be scheduled', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const scheduler = new WorkflowScheduler();

    const base = {
      name: 'stage',
      description: '',
      type: StageType.Sequential,
      handler: 'h',
      inputMapping: {},
      outputMapping: {},
      timeoutMs: 1000,
      retryPolicy: {} as any,
      compensation: {} as any,
      conditions: [],
      metadata: {},
    };

    const plans = scheduler.schedule([
      { ...base, id: 'a' as any, dependencies: ['b' as any] },
      { ...base, id: 'b' as any, dependencies: ['a' as any] },
      { ...base, id: 'c' as any, dependencies: ['missing' as any] },
      { ...base, id: 'd' as any, dependencies: [] },
    ]);

    expect(plans.map(p => p.stageId)).toEqual(['d']);
    expect(scheduler.unscheduledStages.map(s => s.stageId).sort()).toEqual(['a', 'b', 'c']);
    expect(scheduler.unscheduledStages.find(s => s.stageId === 'c')!.missingDependencies).toEqual(['missing']);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('core regression: knowledge versioning', () => {
  it('paginates history newest first', async () => {
    const manager = new KnowledgeVersionManager();
    const itemId = 'item-1' as any;
    for (let i = 0; i < 5; i++) {
      await manager.createVersion(itemId, `v${i}`, {}, 'active' as any);
    }

    const page1 = await manager.getHistory(itemId, 0, 2);
    const page2 = await manager.getHistory(itemId, 2, 2);
    const all = await manager.getVersions(itemId);

    expect(page1.versions.map(v => v.revision)).toEqual([5, 4]);
    expect(page2.versions.map(v => v.revision)).toEqual([3, 2]);
    expect(all.map(v => v.revision)).toEqual([5, 4, 3, 2, 1]);
  });
});

describe('core regression: cost engine', () => {
  it('fills byProvider and byModel', async () => {
    const model = {
      id: 'model-1' as ModelId,
      providerId: 'openai' as ProviderId,
      costProfile: { inputCostPer1kTokens: 1, outputCostPer1kTokens: 2, currency: 'USD' },
    } as unknown as ModelDescriptor;

    const engine = new CostEngine(
      { defaultCurrency: 'USD' } as any,
      { getModel: async () => model } as any,
    );

    const detail = await engine.calculate(1000, 1000, 'model-1' as ModelId);
    await engine.record(detail);

    const report = await engine.getReport();
    expect(Object.keys(report.byProvider)).toEqual(['openai']);
    expect(Object.keys(report.byModel)).toEqual(['model-1']);
    expect(await engine.getByProvider('openai')).toBeCloseTo(3);
    expect(await engine.getByModel('model-1')).toBeCloseTo(3);
  });
});
