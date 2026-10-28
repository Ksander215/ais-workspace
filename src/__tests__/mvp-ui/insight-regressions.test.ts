/**
 * Insight lifecycle — regression tests for bugs found in the insight flow.
 *
 * 1. "Отложить" (DEFER) from EVALUATING was rejected with 400.
 * 2. A deferred insight became REVISITABLE immediately, because the context
 *    snapshot contained project.updatedAt — which the decision itself changes.
 * 3. A rejected insight silently returned to the queue as REVISITABLE.
 * 4. GET /insights/revisitable mutated the project file on disk.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectStore } from '../../mvp-ui/project-store.js';
import { InsightService } from '../../mvp-ui/insight-service.js';
import { InsightStatus, GoalAlignment } from '../../mvp-ui/project-types.js';
import { mkdtempSync, rmSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

let tmpDir: string;
let store: ProjectStore;
let service: InsightService;
let projectId: string;

function evaluatedInsight(text = 'Test'): ReturnType<InsightService['createInsight']> {
  const insight = service.createInsight({ projectId, text });
  service.evaluateInsight({
    projectId, insightId: insight.id,
    relevance: 0.5, feasibility: 0.5,
    goalAlignment: GoalAlignment.MEDIUM, rationale: 'test',
  });
  return insight;
}

beforeEach(() => {
  tmpDir = mkdtempSync(resolve(tmpdir(), 'test-insight-reg-'));
  store = new ProjectStore(tmpDir);
  service = new InsightService(store);
  projectId = store.getOrCreate('/test/project', 'test-project').id;
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('insight regressions', () => {
  it('allows DEFER from EVALUATING (the UI shows "Отложить" there)', () => {
    const insight = evaluatedInsight();
    const decided = service.decideInsight({
      projectId, insightId: insight.id, decision: 'DEFER',
      revisitCondition: 'When the API key is rotated',
    });
    expect(decided.status).toBe(InsightStatus.DEFERRED);
    expect(decided.revisitCondition).toBe('When the API key is rotated');
  });

  it('does not make a deferred insight revisitable without a real context change', () => {
    const insight = evaluatedInsight();
    service.decideInsight({ projectId, insightId: insight.id, decision: 'DEFER' });

    expect(service.checkRevisitability(projectId)).toHaveLength(0);
    expect(store.getInsight(projectId, insight.id)!.status).toBe(InsightStatus.DEFERRED);
  });

  it('makes a deferred insight revisitable when the context really changes', () => {
    const insight = evaluatedInsight();
    service.decideInsight({ projectId, insightId: insight.id, decision: 'DEFER' });

    store.addSession(projectId, {
      sessionId: 'sess-1', projectPath: '/test/project',
      createdAt: new Date().toISOString(), question: 'Q', answer: 'A',
      claims: [], sources: [], findings: [],
    });

    const revisitable = service.checkRevisitability(projectId);
    expect(revisitable).toHaveLength(1);
    expect(revisitable[0].status).toBe(InsightStatus.REVISITABLE);
  });

  it('never returns a rejected insight to the queue', () => {
    const insight = evaluatedInsight();
    service.decideInsight({ projectId, insightId: insight.id, decision: 'REJECT' });

    store.addSession(projectId, {
      sessionId: 'sess-1', projectPath: '/test/project',
      createdAt: new Date().toISOString(), question: 'Q', answer: 'A',
      claims: [], sources: [], findings: [],
    });

    expect(service.checkRevisitability(projectId)).toHaveLength(0);
    expect(store.getInsight(projectId, insight.id)!.status).toBe(InsightStatus.REJECTED);
    expect(service.listRevisitableInsights(projectId)).toHaveLength(0);
  });

  it('reading the revisitable list does not write to disk', () => {
    const insight = evaluatedInsight();
    service.decideInsight({ projectId, insightId: insight.id, decision: 'DEFER' });

    const projectFile = () => {
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const entry of readdirSync(dir)) {
          const full = resolve(dir, entry);
          if (statSync(full).isDirectory()) walk(full);
          else files.push(full);
        }
      };
      walk(tmpDir);
      return files;
    };

    const before = projectFile().map((f) => ({ f, mtime: statSync(f).mtimeMs }));
    service.listRevisitableInsights(projectId);
    const after = projectFile().map((f) => ({ f, mtime: statSync(f).mtimeMs }));

    expect(after.length).toBe(before.length);
    for (const entry of after) {
      const old = before.find((b) => b.f === entry.f);
      expect(old).toBeDefined();
      expect(entry.mtime).toBe(old!.mtime);
    }
  });
});
