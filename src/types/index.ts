/** @notice Library imports */
import { LLMModels, Provider, EmbeddingModels } from "@/configs/constants";

export type Config = {
  /// User details
  username: string;
  /// Provider
  provider: Provider;
  openAIApiKey: string | symbol;
  ollamaBaseUrl: string | symbol;
  /// Messages
  messageModel: Omit<LLMModels, "none">;
  /// Embeddings
  embeddingModel: Omit<EmbeddingModels, "none">;
};
