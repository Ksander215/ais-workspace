/**
 * Regressions for the real-inference path.
 *
 * These defects made every real question die BEFORE the model was called:
 *  * intent was classified over question + 30KB of project context, so code
 *    words ("structure", "process", "plan") decided the intent type;
 *  * intent confidence was divided by the rule's pattern count, so a normal
 *    question scored below the clarification threshold and was answered with
 *    "Could you provide more details about..." instead of a model answer;
 *  * a Workflow intent always "had" a workflow available, so it replaced the
 *    model's answer with a placeholder string;
 *  * no provider adapter was registered in stub mode, so anything that
 *    reached generation failed with "Provider 'openai' is unavailable";
 *  * a failed turn left the runtime stuck in Processing forever.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IntentRuntime } from '../../../core/cognitive/intent-runtime.js';
import { ResponsePlanner, DefaultResponsePlannerConfig } from '../../../core/cognitive/response-planner.js';
import { CognitiveRuntime } from '../../../core/cognitive/cognitive-runtime.js';
import { OpenAIStubAdapter } from '../../../core/cognitive/provider-adapters.js';
import { InteractionService } from '../../../core/interaction-layer/interaction-service.js';
import { ProviderAdapterType, CognitiveState, IntentType } from '../../../core/cognitive/types.js';

const POLYGON_QUESTIONS = [
  'What is the overall architecture of this project?',
  'What are the main modules and their responsibilities?',
  'What are the important dependencies between modules?',
  'How is execution and workflow orchestration implemented?',
  'Which claims are directly supported by repository evidence, and which are inference?',
  'What cannot be determined reliably from this repository?',
  'Which information is current versus historical or stale?',
];

describe('real-inference regressions', () => {
  describe('intent confidence', () => {
    it('does not depend on how many patterns a rule declares', () => {
      const runtime = new IntentRuntime();

      // The Question rule lists 11 patterns. Two matches used to score
      // 2/11*0.8+0.2 = 0.345 — below the 0.5 clarification threshold.
      const classification = runtime.evaluateRules('What is the architecture?');
      expect(classification.type).toBe(IntentType.Question);
      expect(classification.confidence).toBeGreaterThanOrEqual(0.5);
    });

    it('scores every Polygon question above the clarification threshold', () => {
      const runtime = new IntentRuntime();
      for (const question of POLYGON_QUESTIONS) {
        const classification = runtime.evaluateRules(question);
        expect(classification.confidence).toBeGreaterThanOrEqual(0.5);
      }
    });

    it('scores higher with more independent matches', () => {
      const runtime = new IntentRuntime();
      const single = runtime.evaluateRules('Explain the module.');
      const many = runtime.evaluateRules('What is it, how does it work, why, where, when, who?');
      expect(many.confidence).toBeGreaterThan(single.confidence);
    });

    it('keeps the multi-pattern score above 0.5', () => {
      const runtime = new IntentRuntime();
      const result = runtime.evaluateRules(
        'What is the question and how to explain the what where when why?',
      );
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('intent classification over the question only', () => {
    it('is not steered by words that appear in the project context', () => {
      const runtime = new IntentRuntime();

      // What the assembled context used to inject into the classifier.
      const context = [
        'Project Context:',
        'packages/core/agent-loop/src/process.ts',
        'interface WorkflowStructure { plan: string }',
        'export function schedulePipeline() {}',
        'interface Config { status: string }',
        'const orchestrator = new WorkflowManager();',
      ].join('\n');

      const questionOnly = runtime.evaluateRules('What is the overall architecture of this project?');
      const polluted = runtime.evaluateRules(
        `What is the overall architecture of this project?\n\n---\n${context}`,
      );

      expect(polluted.type).toBe(questionOnly.type);
      expect(polluted.confidence).toBe(questionOnly.confidence);
    });

    it('classifies every Polygon question as Question', () => {
      const runtime = new IntentRuntime();
      for (const question of POLYGON_QUESTIONS) {
        expect(runtime.evaluateRules(question).type).toBe(IntentType.Question);
      }
    });
  });

  describe('response planner', () => {
    function mockIntent(overrides: Record<string, unknown> = {}): any {
      return Object.freeze({
        id: 'intent-1',
        type: IntentType.Workflow,
        goal: 'test goal',
        priority: 5,
        complexity: 'Simple',
        confidence: 0.9,
        requiredCapabilities: ['workflow'],
        parameters: {},
        detectedAt: '2024-01-01T00:00:00Z',
        metadata: Object.freeze({}),
        ...overrides,
      });
    }

    function mockContext(overrides: Record<string, unknown> = {}): any {
      return Object.freeze({
        sessionId: 's',
        conversationId: 'c',
        turnId: null,
        intent: null,
        identity: null,
        memory: Object.freeze({
          workingEntries: [],
          sessionEntries: [],
          relevantEntries: [],
          summary: null,
        }),
        knowledge: Object.freeze({
          relevantItems: [],
          namespaces: [],
          totalItems: 0,
        }),
        capabilities: Object.freeze({
          available: [],
          required: [],
          denied: [],
          activePacks: [],
        }),
        policies: Object.freeze({
          maxTokens: 4096,
          allowedProviders: [],
          privacyLevel: 1,
          trustLevel: 1,
          costBudget: 100,
          activePolicies: [],
        }),
        environment: Object.freeze({
          runtimeVersion: '0.4.0',
          sessionId: 's',
          timezone: 'UTC',
          timestamp: '2024-01-01T00:00:00Z',
        }),
        conversationHistory: Object.freeze({
          turnCount: 0,
          recentMessages: [],
          summary: null,
        }),
        assembledAt: '2024-01-01T00:00:00Z',
        tokenEstimate: 100,
        ...overrides,
      });
    }

    it('does not claim a workflow exists when no capability is available', () => {
      const planner = new ResponsePlanner();
      const plan = planner.plan(mockIntent(), mockContext());
      expect(plan.decision).not.toBe('Workflow');
    });

    it('still uses a workflow when the capability is registered', () => {
      const planner = new ResponsePlanner();
      const context = mockContext({
        capabilities: Object.freeze({
          available: ['workflow'],
          required: [],
          denied: [],
          activePacks: [],
        }),
      });
      const plan = planner.plan(mockIntent(), context);
      expect(plan.decision).toBe('Workflow');
    });

    it('answers a normal question instead of requesting one', () => {
      const planner = new ResponsePlanner();
      const plan = planner.plan(
        mockIntent({ type: IntentType.Question, confidence: 0.65, requiredCapabilities: [] }),
        mockContext(),
      );
      expect(plan.decision).toBe('Answer');
    });
  });

  describe('cognitive runtime', () => {
    const providerConfig = Object.freeze({
      adapterType: ProviderAdapterType.OpenAI,
      name: 'openai-stub',
      model: 'gpt-4',
      maxTokens: 4096,
      temperature: 0.7,
      timeoutMs: 30000,
      metadata: Object.freeze({}),
    });

    it('registers a working provider in stub mode', async () => {
      const runtime = new CognitiveRuntime();
      await runtime.initialize();
      await runtime.start();

      const result = await runtime.process('what is AI?');
      expect(result.response).toBeTruthy();
      expect(result.intent.type).toBe(IntentType.Question);
    });

    it('classifies intent over intentSource, not over the payload', async () => {
      const runtime = new CognitiveRuntime();
      await runtime.initialize();
      await runtime.start();
      const adapter = new OpenAIStubAdapter();
      await adapter.initialize(providerConfig);
      await runtime.providerRuntime.registerAdapter(adapter);

      const payload = [
        'What is the overall architecture of this project?',
        '---',
        'Project Context: workflow pipeline process structure plan config status log',
      ].join('\n');

      const result = await runtime.process(payload, {
        intentSource: 'What is the overall architecture of this project?',
      });
      expect(result.intent.type).toBe(IntentType.Question);
    });

    it('returns to Ready after a failed turn', async () => {
      const runtime = new CognitiveRuntime({ defaultProvider: 'nonexistent' });
      await runtime.initialize();
      await runtime.start();

      await expect(runtime.process('what is AI?')).rejects.toThrow();
      expect(runtime.state).toBe(CognitiveState.Ready);
    });
  });
});

describe('real-inference claims', () => {
  const findStatementAbout = (answer: string, filePath: string): string | null =>
    (InteractionService.prototype as any).findStatementAbout.call({}, answer, filePath);

  it('states what the answer says about the source, not just the file name', () => {
    const answer = 'The boot flow lives in apps/cli/src/profile-boot.ts and resolves the profile.';
    const found = findStatementAbout(answer, 'apps/cli/src/profile-boot.ts');
    expect(found).toContain('profile-boot.ts');
    expect(found).toContain('boot flow');
  });

  it('returns null when the answer never mentions the source', () => {
    expect(findStatementAbout('Nothing relevant here.', 'apps/cli/src/profile-boot.ts')).toBeNull();
  });
});
