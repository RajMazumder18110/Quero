console.log("Hello via Bun!");

import { OllamaEmbeddings } from "@langchain/ollama";
import { FileBasedMemoryVectorStore } from "@/core/FileBasedMemoryVectorStore";

const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text",
  baseUrl: "http://192.168.0.166:11434",
});
const vectorStore = new FileBasedMemoryVectorStore(embeddings);

await vectorStore.addDocuments([
  {
    pageContent: "Hello World",
    metadata: {},
  },
]);
