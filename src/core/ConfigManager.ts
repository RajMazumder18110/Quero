/** @notice Library imports */
import {
  mkdirSync,
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import os from "os";
import path from "path";
/// Local imports
import { ROOT_FILE_PATH } from "@/configs/constants";

/// Type
type Config = {
  /// Messages
  messageModel: string;

  /// Embeddings
  embeddingModel: string;
};

export class ConfigManager {
  public static CONFIGS_FILE = "configs.json";
  public static EMBEDDINGS_FILE = "embeddings.json";

  public static setUpConfigs(configs: Config) {
    if (!this.isConfigPresent()) {
      /// Updating the embeddings with new data
      const homeDir = os.homedir();
      const filePath = path.join(homeDir, ROOT_FILE_PATH, this.CONFIGS_FILE);
      writeFileSync(filePath, JSON.stringify(configs, null, "\t"));
    }
  }

  public static getConfigs(): Config {
    /// Getting the current configs
    const homeDir = os.homedir();
    const filePath = path.join(homeDir, ROOT_FILE_PATH, this.CONFIGS_FILE);
    return JSON.parse(readFileSync(filePath).toString());
  }

  public static isConfigPresent(): boolean {
    const homeDir = os.homedir();
    const filePath = path.join(homeDir, ROOT_FILE_PATH, this.CONFIGS_FILE);
    return existsSync(filePath);
  }

  public static makeConfigDirIfNotPresent() {
    const homeDir = os.homedir();
    const dirs = readdirSync(homeDir);

    if (!dirs.includes(ROOT_FILE_PATH)) {
      const filePath = path.join(homeDir, ROOT_FILE_PATH);
      mkdirSync(filePath);
    }
  }
}
