/** @notice Library imports */
import os from "os";
import path from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
/// Types
import type { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
/// Local imports
import { ConfigManager } from "./ConfigManager";
import { ROOT_FILE_PATH } from "@/configs/constants";

export class FileBasedMemoryVectorStore extends MemoryVectorStore {
  constructor(embeddings: EmbeddingsInterface) {
    super(embeddings, {});
    const vectors = this._loadEmbeddings();
    this.memoryVectors = vectors;
  }

  /// Performs embedding task and save into JSON
  override async addVectors(
    vectors: number[][],
    documents: Document[]
  ): Promise<void> {
    /// Performing super method.
    super.addVectors(vectors, documents);

    /// Updating the embeddings with new data
    const homeDir = os.homedir();
    const filePath = path.join(
      homeDir,
      ROOT_FILE_PATH,
      ConfigManager.EMBEDDINGS_FILE
    );
    writeFileSync(filePath, JSON.stringify(this.memoryVectors, null, "\t"));
  }

  private _loadEmbeddings(): MemoryVectorStore["memoryVectors"] {
    const homeDir = os.homedir();
    const filePath = path.join(
      homeDir,
      ROOT_FILE_PATH,
      ConfigManager.EMBEDDINGS_FILE
    );

    const isPresent = existsSync(filePath);
    if (isPresent) return JSON.parse(readFileSync(filePath).toString());
    return [];
  }
}
