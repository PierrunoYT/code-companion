const modelOptions = {
  'gpt-4-turbo': 'GPT-4 Turbo',
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o Mini',
  'gpt-4': 'GPT-4',
  'claude-3-5-sonnet-20240620': 'Claude 3.5 Sonnet',
  'claude-3-opus-20240229': 'Claude 3 Opus',
  'openrouter:anthropic/claude-3-sonnet-20240229': 'OpenRouter: Claude 3.5 Sonnet',
};

const defaultModel = 'openrouter:anthropic/claude-3-sonnet-20240229';
const defaultOpenAISmallModel = 'gpt-4o-mini';
const defaultAnthropicSmallModel = 'claude-3-5-sonnet-20240620';

const EMBEDDINGS_VERSION = 'v1.9'; // when reindexing of code embedding is needed, update this version
const EMBEDDINGS_MODEL_NAME = 'text-embedding-ada-002';

module.exports = {
  modelOptions,
  defaultModel,
  defaultOpenAISmallModel,
  defaultAnthropicSmallModel,
  EMBEDDINGS_VERSION,
  EMBEDDINGS_MODEL_NAME,
};
