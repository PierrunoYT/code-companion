const { OpenAI } = require('openai');
const { log, getTokenCount } = require('../utils');

const MAX_RETRIES = 5;

class OpenRouterModel {
  constructor({ model, apiKey, streamCallback, chatController, systemPrompt }) {
    this.model = model;
    this.chatController = chatController;
    this.systemPrompt = systemPrompt;
    const config = {
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
      maxRetries: MAX_RETRIES,
      baseURL: 'https://openrouter.ai/api/v1',
    };
    this.client = new OpenAI(config);
    this.streamCallback = streamCallback;
  }

  async call({ messages, model, tool = null, tools = null, temperature = 0.0 }) {
    let response;
    const actualModel = this.getModelIdentifier(model || this.model);
    const callParams = {
      model: `openrouter:${actualModel}`,
      messages: this.shouldUseSystemPrompt(actualModel) ? 
        [{ role: 'system', content: this.systemPrompt }, ...messages] : 
        messages,
      temperature,
    };
    if (tool !== null) {
      response = await this.toolUse(callParams, tool);
    } else {
      callParams.tools = tools ? tools.map((tool) => this.openAiToolFormat(tool)) : undefined;
      response = await this.stream(callParams);
    }
    return response;
  }

  async stream(callParams) {
    callParams.stream = true;
    log('Calling OpenRouter API:', callParams);
    const stream = this.client.beta.chat.completions.stream(callParams, {
      signal: this.chatController.abortController.signal,
    });
    stream.on('content', (_delta, snapshot) => {
      this.streamCallback(snapshot);
    });
    const chatCompletion = await stream.finalChatCompletion();
    log('Raw response', chatCompletion);
    return {
      content: chatCompletion.choices[0].message.content,
      tool_calls: this.formattedToolCalls(chatCompletion.choices[0].message.tool_calls),
      usage: {
        input_tokens: getTokenCount(callParams.messages),
        output_tokens: getTokenCount(chatCompletion.choices[0].message),
      },
    };
  }

  async toolUse(callParams, tool) {
    callParams.tools = [this.openAiToolFormat(tool)];
    callParams.tool_choice = { type: 'function', function: { name: tool.name } };
    log('Calling OpenRouter API:', callParams);
    const chatCompletion = await this.client.chat.completions.create(callParams, {
      signal: this.chatController.abortController.signal,
    });
    log('Raw response', chatCompletion);
    const { result } = JSON.parse(chatCompletion.choices[0].message.tool_calls[0].function.arguments);
    return {
      content: result,
      usage: {
        input_tokens: chatCompletion.usage?.prompt_tokens,
        output_tokens: chatCompletion.usage?.completion_tokens,
      },
    };
  }

  formattedToolCalls(toolCalls) {
    if (!toolCalls) return null;

    let parsedToolCalls = [];
    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);
      parsedToolCalls.push({
        function: {
          name: functionName,
          arguments: args,
        },
      });
    }
    return parsedToolCalls;
  }

  openAiToolFormat(tool) {
    return {
      type: 'function',
      function: tool,
    };
  }

  shouldUseSystemPrompt(model) {
    return model.includes('anthropic/claude-3.5-sonnet') && this.systemPrompt;
  }

  getModelIdentifier(model) {
    if (model.includes('claude-3.5-sonnet')) {
      return 'anthropic/claude-3.5-sonnet';
    }
    return model;
  }

  abort() {
    this.chatController.abortController.abort();
    this.chatController.abortController = new AbortController();
  }
}

module.exports = OpenRouterModel;
