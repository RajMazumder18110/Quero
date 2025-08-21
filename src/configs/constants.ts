export const ROOT_FILE_PATH = ".quero";

export const enum Provider {
  OLLAMA = "ollama",
  OPENAI = "openai",
}

export const enum EmbeddingModels {
  /// Ollama
  NOMIC_EMBED_TEXT = "nomic-embed-text",
  MXBAI_EMBED_LARGE = "mxbai-embed-large",
  /// OpenAI
  TEXT_EMBEDDINGS_SMALL = "text-embedding-3-small",
  TEXT_EMBEDDINGS_lARGE = "text-embedding-3-large",
  /// Others
  NONE = "none",
}

export const enum LLMModels {
  /// Ollama
  GEMMA3_12B = "gemma3:12b",
  LLAMA3_1_8B = "llama3.1:8b",
  /// OpenAI
  GPT_5 = "gpt-5-2025-08-07",
  GPT_5_MINI = "gpt-5-mini-2025-08-07",
  GPT_5_NANO = "gpt-5-nano-2025-08-07",
  /// Others
  NONE = "none",
}
