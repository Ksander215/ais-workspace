/**
 * Cognitive Runtime — Main Orchestrator
 * TASK-AIS-003I.000 — Cognitive Runtime & Conversation Orchestrator
 *
 * The central orchestrator that unifies all subsystems into a single
 * Cognitive Loop: Intent → Context → Memory → Knowledge → Identity →
 * Capability → Workflow → Tool → LLM → Execution → Response → Memory Update.
 *
 * Responsibilities:
 *   - Orchestrate the full cognitive pipeline
 *   - Manage lifecycle (initialize, process, shutdown)
 *   - Integrate with all existing Runtimes through contracts
 *   - Publish domain events via EventBus
 *   - Collect metrics and trace execution
 *   - Enforce policies
 *   - Manage conversations
 *
 * This Runtime is NOT a chat. It is the thinking mechanism of the platform.
 * Conversation is merely one way of interacting with it.
 *
 * Conforms to: CON-001.000, ARC-001.001, DOM-002.000, ADR-001..014
 */

import type { EventBus } from '../events/event-bus.js';
import { TypedStateMachine } from '../fsm/state-machine.js';
import type { StateMachine } from '../fsm/state-machine.js';

import type {
  CognitiveRuntimeConfig,
  CognitiveSessionId,
  PromptContext,
  Intent,
  Conversation,
  TokenUsage,
} from './types.js';
import {
  CognitiveState,
  MessageRole,
  DefaultCognitiveRuntimeConfig,
  brandCognitiveSessionId,
  ProviderAdapterType,
} from './types.js';

import { createCognitiveFSM } from './cognitive-fsm.js';
import { IntentRuntime, DefaultIntentRuntimeConfig } from './intent-runtime.js';
import { ContextBuilder, DefaultContextBuilderConfig } from './context-builder.js';
import { ConversationRuntime, DefaultConversationRuntimeConfig } from './conversation-runtime.js';
import { PromptComposer, DefaultPromptComposerConfig } from './prompt-composer.js';
import { ProviderRuntime } from './provider-runtime.js';
import { ModelRouter, DefaultModelRouterConfig } from './model-router.js';
import { ResponsePlanner, DefaultResponsePlannerConfig } from './response-planner.js';
import { ContextCompressionRuntime, DefaultCompressionConfig } from './context-compression.js';
import { ConversationMemoryBridge, DefaultMemoryBridgeConfig } from './memory-bridge.js';
import { CognitivePolicyEngine } from './cognitive-policies.js';
import { CognitiveMetricsCollector } from './cognitive-metrics.js';
import { CognitiveTrace } from './cognitive-trace.js';

// Wave 1 TD-1: Real LLM adapter behind feature flag
import { RealOpenAIAdapter } from './real-provider-wrapper.js';
import { OpenAIStubAdapter } from './provider-adapters.js';

/**
 * Read a positive integer from the environment, falling back to a default.
 */
function readPositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

import type {
  MemoryRuntimeContract,
  KnowledgeRuntimeContract,
  IdentityRuntimeContract,
  WorkflowRuntimeContract,
  ToolRuntimeContract,
  CapabilityRuntimeContract,
} from './types.js';

/**
 * CognitiveRuntime — the central cognitive orchestrator.
 */
export class CognitiveRuntime {
  private _config: CognitiveRuntimeConfig;
  private readonly _fsm: StateMachine<CognitiveState>;
  private readonly _intentRuntime: IntentRuntime;
  private readonly _contextBuilder: ContextBuilder;
  private readonly _conversationRuntime: ConversationRuntime;
  private readonly _promptComposer: PromptComposer;
  private readonly _providerRuntime: ProviderRuntime;
  private readonly _modelRouter: ModelRouter;
  private readonly _responsePlanner: ResponsePlanner;
  private readonly _compression: ContextCompressionRuntime;
  private readonly _memoryBridge: ConversationMemoryBridge;
  private readonly _policyEngine: CognitivePolicyEngine;
  private readonly _metrics: CognitiveMetricsCollector;
  private readonly _trace: CognitiveTrace;
  private readonly _eventBus: EventBus | null;

  private _sessionId: CognitiveSessionId | null = null;
  private _currentConversation: Conversation | null = null;

  get sessionId(): CognitiveSessionId | null { return this._sessionId; }
  get eventBus(): EventBus | null { return this._eventBus; }

  constructor(config?: Partial<CognitiveRuntimeConfig>, eventBus?: EventBus) {
    this._config = { ...DefaultCognitiveRuntimeConfig, ...config };
    this._fsm = new TypedStateMachine(createCognitiveFSM());
    this._eventBus = eventBus ?? null;

    // Initialize subsystems
    this._intentRuntime = new IntentRuntime(DefaultIntentRuntimeConfig);
    this._contextBuilder = new ContextBuilder(DefaultContextBuilderConfig);
    this._conversationRuntime = new ConversationRuntime(DefaultConversationRuntimeConfig);
    this._promptComposer = new PromptComposer(DefaultPromptComposerConfig);
    this._providerRuntime = new ProviderRuntime();
    this._modelRouter = new ModelRouter(DefaultModelRouterConfig);
    this._responsePlanner = new ResponsePlanner(DefaultResponsePlannerConfig);
    this._compression = new ContextCompressionRuntime(DefaultCompressionConfig);
    this._memoryBridge = new ConversationMemoryBridge(DefaultMemoryBridgeConfig);
    this._policyEngine = new CognitivePolicyEngine();
    this._policyEngine.registerDefaultEvaluators();
    this._metrics = new CognitiveMetricsCollector();
    this._trace = new CognitiveTrace(this._config.traceEnabled);

    // Register config policies
    for (const policy of this._config.policies) {
      this._policyEngine.registerPolicy(policy);
    }
  }

  // ─── Property Accessors ────────────────────────────────────────

  get state(): CognitiveState {
    return this._fsm.currentState;
  }

  get intentRuntime(): IntentRuntime {
    return this._intentRuntime;
  }

  get contextBuilder(): ContextBuilder {
    return this._contextBuilder;
  }

  get conversationRuntime(): ConversationRuntime {
    return this._conversationRuntime;
  }

  get promptComposer(): PromptComposer {
    return this._promptComposer;
  }

  get providerRuntime(): ProviderRuntime {
    return this._providerRuntime;
  }

  get modelRouter(): ModelRouter {
    return this._modelRouter;
  }

  get responsePlanner(): ResponsePlanner {
    return this._responsePlanner;
  }

  get compression(): ContextCompressionRuntime {
    return this._compression;
  }

  get memoryBridge(): ConversationMemoryBridge {
    return this._memoryBridge;
  }

  get policyEngine(): CognitivePolicyEngine {
    return this._policyEngine;
  }

  get metrics(): CognitiveMetricsCollector {
    return this._metrics;
  }

  get trace(): CognitiveTrace {
    return this._trace;
  }

  // ─── Lifecycle ─────────────────────────────────────────────────

  /**
   * Initialize the Cognitive Runtime.
   * Wave 1 TD-1: When AIS_REAL_LLM=true, registers RealOpenAIAdapter
   * instead of relying solely on stubs.
   */
  async initialize(): Promise<void> {
    this._fsm.transition(CognitiveState.Initialized);
    this._sessionId = brandCognitiveSessionId(crypto.randomUUID());

    // Wave 1 TD-1: Feature flag — register real OpenAI adapter
    if (process.env.AIS_REAL_LLM === 'true') {
      try {
        const realAdapter = new RealOpenAIAdapter();
        await this._providerRuntime.registerAdapter(realAdapter, {
          adapterType: ProviderAdapterType.OpenAI,
          name: 'openai-real',
          model: process.env.AIS_MODEL ?? 'gpt-4o',
          apiKey: process.env.OPENAI_API_KEY,
          // The model's real context window. Must be the server's limit, not a
          // nominal one: a request larger than this is rejected by the
          // provider, so a wrong value turns into a hard failure.
          maxTokens: readPositiveIntEnv('AIS_MODEL_CONTEXT_TOKENS', 128000),
          temperature: 0.7,
          timeoutMs: 60000,
          metadata: Object.freeze({}),
        });
        // Override default provider to use real adapter
        this._config = {
          ...this._config,
          defaultProvider: 'openai-real',
        };
        this._trace.info({
          sessionId: this._sessionId,
          phase: 'lifecycle',
          action: 'initialize',
          message: 'Cognitive Runtime initialized with REAL OpenAI adapter (AIS_REAL_LLM=true)',
        });
      } catch (error) {
        // If real adapter fails to initialize, log and continue with stubs
        this._trace.warn({
          sessionId: this._sessionId,
          phase: 'lifecycle',
          action: 'initialize',
          message: `Real adapter initialization failed, falling back to stubs: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    } else {
      // Without a real provider the runtime still needs a working adapter for
      // the configured default provider: previously NO adapter was registered
      // in this mode, so any request that actually reached generation failed
      // with "Provider 'openai' is unavailable". The failure was invisible
      // because every question used to be diverted into a clarification
      // request before generation.
      // Only for the built-in default provider name: a runtime configured to
      // use a specific external provider must fail loudly when that provider
      // is missing, not silently answer from a stub.
      if (this._config.defaultProvider === DefaultCognitiveRuntimeConfig.defaultProvider) {
        const stubAdapter = new OpenAIStubAdapter(this._config.defaultProvider);
        await this._providerRuntime.registerAdapter(stubAdapter, {
          adapterType: ProviderAdapterType.OpenAI,
          name: this._config.defaultProvider,
          model: 'stub',
          maxTokens: 4096,
          temperature: 0.7,
          timeoutMs: 30000,
          metadata: Object.freeze({}),
        });
      }
      this._trace.info({
        sessionId: this._sessionId,
        phase: 'lifecycle',
        action: 'initialize',
        message: `Cognitive Runtime initialized with STUB adapter '${this._config.defaultProvider}'`,
      });
    }

    this._metrics.recordSession(true);
  }

  /**
   * Make the runtime ready for processing.
   */
  async start(): Promise<void> {
    this._fsm.transition(CognitiveState.Ready);
    this._trace.info({
      sessionId: this._sessionId!,
      phase: 'lifecycle',
      action: 'start',
      message: 'Cognitive Runtime ready',
    });
  }

  /**
   * Process a user input through the full cognitive loop.
   *
   * `input` is the full prompt payload (question + assembled project
   * context). `options.intentSource` is the text the intent classifier is
   * allowed to look at. They differ because the assembled context is tens of
   * kilobytes of source code: classifying intent over that payload made the
   * classifier read code words ("process", "structure", "workflow") as if the
   * user had asked for them, and turned ordinary questions into the wrong
   * intent type. When omitted, `input` is used for both.
   */
  async process(input: string, options?: { intentSource?: string }): Promise<{
    response: string;
    conversation: Conversation;
    intent: Intent;
    tokens: TokenUsage;
    latencyMs: number;
  }> {
    const startTime = Date.now();
    const intentSource = options?.intentSource ?? input;
    this._fsm.transition(CognitiveState.Processing);

    try {
      // 1. Create or continue conversation
      if (!this._currentConversation) {
        this._currentConversation = this._conversationRuntime.createConversation({
          sessionId: this._sessionId!,
        });
      }

      // 2. Classify intent — over the user's question only, never over the
      //    assembled context payload.
      const intent = this._intentRuntime.classify(intentSource);
      this._trace.info({
        sessionId: this._sessionId!,
        conversationId: this._currentConversation.id,
        phase: 'intent',
        action: 'classify',
        message: `Intent classified: ${intent.type} (confidence: ${intent.confidence})`,
      });

      // 3. Add user message to conversation.
      //    The conversation stores the USER'S QUESTION, not the assembled
      //    prompt payload: the payload is already delivered to the model as
      //    the prompt's user message, and storing it here would send the
      //    whole project context to the model twice.
      const { conversation } = this._conversationRuntime.addMessage({
        conversationId: this._currentConversation.id,
        role: MessageRole.User,
        content: intentSource,
      });
      this._currentConversation = conversation;
      this._metrics.recordMessage();

      // 4. Build cognitive context.
      //    Retrieval runs over the user's question, not over the assembled
      //    payload: the payload is the material to answer FROM, and using it
      //    as the retrieval query mixes unrelated code text into the query.
      const history = this._conversationRuntime.getConversationHistory(conversation.id);
      const cognitiveContext = await this._contextBuilder.build({
        sessionId: this._sessionId!,
        conversationId: conversation.id,
        turnId: null,
        intent,
        userMessage: intentSource,
        conversationHistory: history,
        conversationSummary: conversation.summary,
        timezone: 'UTC',
      });
      this._trace.info({
        sessionId: this._sessionId!,
        conversationId: conversation.id,
        phase: 'context',
        action: 'build',
        message: `Cognitive context assembled (estimate: ${cognitiveContext.tokenEstimate} tokens)`,
      });

      // 5. Evaluate policies
      const policyResult = await this._policyEngine.evaluate({
        context: cognitiveContext,
        intent,
        prompt: null,
      });
      if (!policyResult.allowed) {
        throw new Error(`Policy violation: ${policyResult.violations.map(v => v.reason).join('; ')}`);
      }

      // 6. Build prompt
      const prompt = this._promptComposer.compose(cognitiveContext, input);
      const promptValidation = this._promptComposer.validate(prompt);
      if (!promptValidation.valid) {
        throw new Error(`Prompt validation failed: ${promptValidation.issues.join('; ')}`);
      }

      // 7. Plan response
      const responsePlan = this._responsePlanner.plan(intent, cognitiveContext);
      this._trace.info({
        sessionId: this._sessionId!,
        conversationId: conversation.id,
        phase: 'planning',
        action: 'plan',
        message: `Response planned: ${responsePlan.decision}`,
      });

      // 8. Execute based on plan
      let responseContent: string;
      let tokens: TokenUsage;

      if (responsePlan.decision === 'Answer') {
        const result = await this.generateResponse(prompt);
        responseContent = result.content;
        tokens = result.tokens;
        this._metrics.recordCompletion();
        this._metrics.recordLatency(Date.now() - startTime);
      } else if (responsePlan.decision === 'Tool') {
        responseContent = `Tool invocation requested: ${responsePlan.targetTool ?? 'unknown'}`;
        tokens = { promptTokens: 100, completionTokens: 50, totalTokens: 150 };
        this._metrics.recordToolInvocation();
      } else if (responsePlan.decision === 'Workflow') {
        responseContent = `Workflow execution requested: ${responsePlan.targetWorkflow ?? 'unknown'}`;
        tokens = { promptTokens: 100, completionTokens: 50, totalTokens: 150 };
        this._metrics.recordWorkflowInvocation();
      } else if (responsePlan.decision === 'Clarification') {
        responseContent = responsePlan.clarificationQuestions?.join('\n') ?? 'Please provide more details.';
        tokens = { promptTokens: 50, completionTokens: 80, totalTokens: 130 };
      } else if (responsePlan.decision === 'Escalation') {
        responseContent = responsePlan.escalationReason ?? 'This request requires human review.';
        tokens = { promptTokens: 50, completionTokens: 30, totalTokens: 80 };
      } else {
        responseContent = `Memory recall: ${responsePlan.targetMemory ?? 'general'}`;
        tokens = { promptTokens: 80, completionTokens: 60, totalTokens: 140 };
        this._metrics.recordMemoryHit();
      }

      // 9. Add assistant response
      const { conversation: finalConv } = this._conversationRuntime.addMessage({
        conversationId: conversation.id,
        role: MessageRole.Assistant,
        content: responseContent,
        tokens,
      });
      this._currentConversation = finalConv;

      // 10. Record metrics
      this._metrics.recordTokens(tokens.promptTokens, tokens.completionTokens);
      this._metrics.recordTurn();

      // 11. Memory bridge update
      if (this._config.enableMemoryBridge) {
        await this._memoryBridge.bridge({
          conversation: this._currentConversation,
          turn: this._currentConversation.turns[this._currentConversation.turns.length - 1],
          intent,
          sessionId: this._sessionId!,
        });
      }

      const latencyMs = Date.now() - startTime;

      this._trace.info({
        sessionId: this._sessionId!,
        conversationId: conversation.id,
        phase: 'processing',
        action: 'complete',
        message: `Processing complete (${latencyMs}ms)`,
        durationMs: latencyMs,
      });

      this._fsm.transition(CognitiveState.Completed);
      this._fsm.transition(CognitiveState.Ready);

      return {
        response: responseContent,
        conversation: this._currentConversation,
        intent,
        tokens,
        latencyMs,
      };
    } catch (error) {
      this._metrics.recordFailure();
      this._trace.error({
        sessionId: this._sessionId!,
        conversationId: this._currentConversation?.id,
        phase: 'processing',
        action: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });

      // Return to Ready on error.
      // The FSM has no direct Processing → Ready edge, so the runtime used to
      // stay stuck in Processing forever after a failed turn: it could never
      // process anything again. Route the recovery through Completed, which
      // the FSM does allow, and keep the FSM contract itself unchanged.
      if (this._fsm.canTransition(CognitiveState.Completed)) {
        this._fsm.transition(CognitiveState.Completed);
      }
      if (this._fsm.canTransition(CognitiveState.Ready)) {
        this._fsm.transition(CognitiveState.Ready);
      }

      throw error;
    }
  }

  /**
   * Generate a response using the configured provider.
   */
  async generateResponse(prompt: PromptContext): Promise<{ content: string; tokens: TokenUsage }> {
    const providerName = this._config.defaultProvider;
    const result = await this._providerRuntime.generate(providerName, prompt);
    this._metrics.recordProviderUsage(providerName);
    this._metrics.recordModelUsage(result.model);
    return {
      content: result.content,
      tokens: result.tokens,
    };
  }

  // ─── Runtime Integration ────────────────────────────────────────

  /**
   * Register Memory Runtime contract.
   */
  registerMemoryContract(contract: MemoryRuntimeContract): void {
    this._contextBuilder.registerMemoryContract(contract);
    this._compression.registerMemoryContract(contract);
    this._memoryBridge.registerMemoryContract(contract);
  }

  /**
   * Register Knowledge Runtime contract.
   */
  registerKnowledgeContract(contract: KnowledgeRuntimeContract): void {
    this._contextBuilder.registerKnowledgeContract(contract);
    this._memoryBridge.registerKnowledgeContract(contract);
  }

  /**
   * Register Identity Runtime contract.
   */
  registerIdentityContract(contract: IdentityRuntimeContract): void {
    this._contextBuilder.registerIdentityContract(contract);
  }

  /**
   * Register Workflow Runtime contract.
   */
  registerWorkflowContract(_contract: WorkflowRuntimeContract): void {
    // Stored for future tool/workflow invocations
  }

  /**
   * Register Tool Runtime contract.
   */
  registerToolContract(_contract: ToolRuntimeContract): void {
    // Stored for future tool invocations
  }

  /**
   * Register Capability Runtime contract.
   */
  registerCapabilityContract(contract: CapabilityRuntimeContract): void {
    this._contextBuilder.registerCapabilityContract(contract);
  }

  // ─── Shutdown ──────────────────────────────────────────────────

  /**
   * Shutdown the Cognitive Runtime.
   */
  async shutdown(): Promise<void> {
    this._trace.info({
      sessionId: this._sessionId!,
      phase: 'lifecycle',
      action: 'shutdown',
      message: 'Cognitive Runtime shutting down',
    });

    await this._providerRuntime.sandbox.shutdownAll();

    if (this._fsm.canTransition(CognitiveState.Disposed)) {
      this._fsm.transition(CognitiveState.Disposed);
    }

    this._metrics.recordSession(false);
  }
}

/**
 * Configuration interface export.
 */
export type { CognitiveRuntimeConfig };
