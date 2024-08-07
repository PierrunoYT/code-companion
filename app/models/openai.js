const { OpenAI } = require('openai');
const { log, getTokenCount } = require('../utils');

const MAX_RETRIES = 5;

class OpenAIModel {
  constructor({ model, apiKey, baseUrl, streamCallback, chatController }) {
    this.model = model;
    this.chatController = chatController;
    const config = {
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
      maxRetries: MAX_RETRIES,
    };
    if (baseUrl) {
      config.baseURL = baseUrl;
    }
    this.client = new OpenAI(config);
    this.streamCallback = streamCallback;
  }

  async call({ messages, model, tool = null, tools = null, temperature = 0.0 }) {
    let response;
    const callParams = {
      model: model || this.model,
      messages,
      temperature,
    };
    if (tool !== null) {
      response = await this.toolUse(callParams, tool);
    } else {
      callParams.tools = tools.map((tool) => this.openAiToolFormat(tool));
      response = await this.stream(callParams);
    }
    return response;
  }

  async stream(callParams) {
    callParams.stream = true;
    log('Calling model API:', callParams);
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
    log('Calling model API:', callParams);
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

  abort() {
    this.chatController.abortController.abort();
    this.chatController.abortController = new AbortController();
  }
}

module.exports = OpenAIModel;
