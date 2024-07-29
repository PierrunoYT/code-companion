const modelOptions = {
  'openrouter:anthropic/claude-3-sonnet-20240229': 'OpenRouter: Claude 3.5 Sonnet',
};

const defaultModel = 'openrouter:anthropic/claude-3-sonnet-20240229';
const defaultOpenAISmallModel = 'openrouter:anthropic/claude-3-sonnet-20240229';
const defaultAnthropicSmallModel = 'openrouter:anthropic/claude-3-sonnet-20240229';

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
