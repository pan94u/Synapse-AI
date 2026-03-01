import type { ChatMessage, RoutingStrategy, ToolCall } from '@synapse/shared';
import type { AgentConfig, AgentResult, AgentStreamEvent } from './types.js';

const DEFAULT_MAX_ITERATIONS = 10;

export class Agent {
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  private injectPersonaPrompt(messages: ChatMessage[]): ChatMessage[] {
    if (!this.config.personaContext) return messages;
    const systemMsg: ChatMessage = {
      role: 'system',
      content: this.config.personaContext.systemPromptAddition,
    };
    return [systemMsg, ...messages];
  }

  async run(
    messages: ChatMessage[],
    strategy?: RoutingStrategy,
    requestedModel?: string,
  ): Promise<AgentResult> {
    const maxIterations = this.config.maxIterations ?? DEFAULT_MAX_ITERATIONS;
    const tools = this.config.personaContext
      ? this.config.registry.listForPersona(this.config.personaContext.allowedTools)
      : this.config.registry.list();
    const conversationMessages = this.injectPersonaPrompt([...messages]);
    let totalToolCalls = 0;
    let lastModel = '';

    for (let i = 0; i < maxIterations; i++) {
      const result = await this.config.router.complete(
        { messages: conversationMessages, tools: tools.length > 0 ? tools : undefined },
        strategy,
        requestedModel,
      );

      lastModel = result.model;

      if (!result.toolCalls?.length) {
        // No tool calls — return final text response
        return {
          message: {
            role: 'assistant',
            content: result.content,
            thinking: result.thinking,
          },
          model: result.model,
          usage: result.usage,
          toolCallsExecuted: totalToolCalls,
        };
      }

      // Has tool calls — execute them and continue the loop
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.content || '',
        toolCalls: result.toolCalls,
      };
      conversationMessages.push(assistantMessage);

      const toolResults = await this.config.executor.executeBatch(result.toolCalls);
      totalToolCalls += toolResults.length;

      for (const toolResult of toolResults) {
        conversationMessages.push({
          role: 'tool',
          content: toolResult.content,
          toolCallId: toolResult.callId,
        });
      }
    }

    // Max iterations reached — return whatever we have
    return {
      message: {
        role: 'assistant',
        content: 'Maximum tool iterations reached.',
      },
      model: lastModel,
      toolCallsExecuted: totalToolCalls,
    };
  }

  async *runStream(
    messages: ChatMessage[],
    strategy?: RoutingStrategy,
    requestedModel?: string,
  ): AsyncIterable<AgentStreamEvent> {
    const maxIterations = this.config.maxIterations ?? DEFAULT_MAX_ITERATIONS;
    const tools = this.config.personaContext
      ? this.config.registry.listForPersona(this.config.personaContext.allowedTools)
      : this.config.registry.list();
    const conversationMessages = this.injectPersonaPrompt([...messages]);
    let totalToolCalls = 0;
    let lastModel = '';

    for (let i = 0; i < maxIterations; i++) {
      let content = '';
      let thinking = '';
      let toolCalls: ToolCall[] | undefined;

      for await (const chunk of this.config.router.completeStream(
        { messages: conversationMessages, tools: tools.length > 0 ? tools : undefined },
        strategy,
        requestedModel,
      )) {
        if (chunk.model) lastModel = chunk.model;

        if (chunk.done) {
          toolCalls = chunk.toolCalls;
          break;
        }

        if (chunk.content) {
          content += chunk.content;
          yield { type: 'text', content: chunk.content, thinking: chunk.thinking };
        } else if (chunk.thinking) {
          thinking += chunk.thinking;
          yield { type: 'text', content: '', thinking: chunk.thinking };
        }
      }

      if (!toolCalls?.length) {
        // No tool calls — done
        yield {
          type: 'done',
          message: {
            role: 'assistant',
            content,
            thinking: thinking || undefined,
          },
          model: lastModel,
        };
        return;
      }

      // Has tool calls — execute and continue
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: content || '',
        toolCalls,
      };
      conversationMessages.push(assistantMessage);

      for (const call of toolCalls) {
        yield { type: 'tool_call', call };
      }

      const toolResults = await this.config.executor.executeBatch(toolCalls);
      totalToolCalls += toolResults.length;

      for (const result of toolResults) {
        yield { type: 'tool_result', result };
        conversationMessages.push({
          role: 'tool',
          content: result.content,
          toolCallId: result.callId,
        });
      }
    }

    // Max iterations reached
    yield {
      type: 'done',
      message: {
        role: 'assistant',
        content: 'Maximum tool iterations reached.',
      },
      model: lastModel,
    };
  }
}
