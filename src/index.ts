/** @notice Library imports */
import { QueroBot } from "@/core/QueroBot";
import { ConfigManager } from "@/core/ConfigManager";

console.clear();
ConfigManager.initialize();
QueroBot.startChat();
// const embeddings = new OllamaEmbeddings({
//   model: "nomic-embed-text",
//   baseUrl: "http://192.168.0.166:11434",
// });
// const vectorStore = new FileBasedMemoryVectorStore(embeddings);

// await vectorStore.addDocuments([
//   {
//     pageContent: "Hello World",
//     metadata: {},
//   },
// ]);
