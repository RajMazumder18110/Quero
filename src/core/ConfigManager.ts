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
import { z } from "zod";
import { cancel, intro, isCancel, outro, select, text } from "@clack/prompts";
/// Local imports
import {
  LLMModels,
  Provider,
  ROOT_FILE_PATH,
  EmbeddingModels,
} from "@/configs/constants";
import type { Config } from "@/types";

export class ConfigManager {
  public static CONFIGS_FILE = "configs.json";
  public static EMBEDDINGS_FILE = "embeddings.json";

  public static async initialize() {
    this._makeConfigDirIfNotPresent();

    if (!this._isConfigPresent()) {
      /// Updating the configs
      const homeDir = os.homedir();
      const filePath = path.join(homeDir, ROOT_FILE_PATH, this.CONFIGS_FILE);

      const configs = await this._askQuestions();
      writeFileSync(filePath, JSON.stringify(configs, null, "\t"));
    }
  }

  public static getConfigs(): Config {
    /// Getting the current configs
    const homeDir = os.homedir();
    const filePath = path.join(homeDir, ROOT_FILE_PATH, this.CONFIGS_FILE);
    return JSON.parse(readFileSync(filePath).toString());
  }

  private static _isConfigPresent(): boolean {
    const homeDir = os.homedir();
    const filePath = path.join(homeDir, ROOT_FILE_PATH, this.CONFIGS_FILE);
    return existsSync(filePath);
  }

  private static _makeConfigDirIfNotPresent() {
    const homeDir = os.homedir();
    const dirs = readdirSync(homeDir);

    if (!dirs.includes(ROOT_FILE_PATH)) {
      const filePath = path.join(homeDir, ROOT_FILE_PATH);
      mkdirSync(filePath);
    }
  }

  private static async _askQuestions(): Promise<Config> {
    intro(`Hi, I'm Quero. Your future assistant.`);

    /// User's name.
    const username = await text({
      message: "What should I call you?",
      placeholder: "John Doe",
      validate(value) {
        if (value.length < 3) return new Error("Atleast 3 characters!");
      },
    });
    if (isCancel(username)) {
      cancel("Will see you soon! :(");
      process.exit(1);
    }

    /// Provider
    const provider = await select({
      message: "Could you help me to select my provider?",
      options: [
        {
          value: Provider.OLLAMA,
          label: "Ollama (Recommended)",
        },
        {
          value: Provider.OPENAI,
          label: "OpenAI",
        },
      ],
      initialValue: Provider.OLLAMA,
    });
    if (isCancel(provider)) {
      cancel("Will see you soon! :(");
      process.exit(1);
    }

    /// LLM model name
    let messageModel = await select({
      message: "Which 🧠 should I use?",
      options:
        provider === Provider.OLLAMA
          ? [
              {
                value: LLMModels.GEMMA3_12B as string,
                label: "Gemma3:12b (recommended)",
              },
              {
                value: LLMModels.LLAMA3_1_8B as string,
                label: "Llama3.1:8b",
              },
              {
                value: LLMModels.NONE as string,
                label: "Other",
              },
            ]
          : [
              {
                value: LLMModels.GPT_5 as string,
                label: "GPT-5 (recommended)",
              },
              {
                value: LLMModels.GPT_5_MINI as string,
                label: "GPT-5 Mini",
              },
              {
                value: LLMModels.GPT_5_NANO as string,
                label: "GPT-5 Nano",
              },
              {
                value: LLMModels.NONE as string,
                label: "Other",
              },
            ],
    });
    if (isCancel(messageModel)) {
      cancel("Will see you soon! :(");
      process.exit(1);
    }

    if (messageModel === LLMModels.NONE) {
      messageModel = await text({
        message: "Model name?",
        placeholder: "gpt-oss-20b",
      });
    }
    if (isCancel(messageModel)) {
      cancel("Will see you soon! :(");
      process.exit(1);
    }

    let ollamaBaseUrl: string | symbol = "";
    let openAIApiKey: string | symbol = "";

    /// Incase of provider is `Ollama`
    if (provider === Provider.OLLAMA) {
      ollamaBaseUrl = await text({
        message: "Which url should I use?",
        placeholder: "http://localhost:11434/v1/",
        defaultValue: "http://localhost:11434/v1/",
        initialValue: "http://localhost:11434/v1/",
        validate(value) {
          const { error } = z.url({ error: "Invalid url" }).safeParse(value);
          return error?.issues.at(0)?.message;
        },
      });
      if (isCancel(ollamaBaseUrl)) {
        cancel("Will see you soon! :(");
        process.exit(1);
      }
    }
    /// Incase of provider is `OpenAI`
    else {
      openAIApiKey = await text({
        message: "OpenAI api key",
        placeholder: "ABCDFEGH",
      });
      if (isCancel(openAIApiKey)) {
        cancel("Will see you soon! :(");
        process.exit(1);
      }
    }

    /// Embedding models
    let embeddingModel = await select({
      message: "Which embedding model should I use?",
      options:
        provider === Provider.OLLAMA
          ? [
              {
                value: EmbeddingModels.NOMIC_EMBED_TEXT as string,
                label: `${EmbeddingModels.NOMIC_EMBED_TEXT} (recommended)`,
              },
              {
                value: EmbeddingModels.MXBAI_EMBED_LARGE as string,
              },
              {
                value: EmbeddingModels.NONE as string,
                label: "Other",
              },
            ]
          : [
              {
                value: EmbeddingModels.TEXT_EMBEDDINGS_lARGE as string,
                label: `${EmbeddingModels.TEXT_EMBEDDINGS_lARGE} (recommended)`,
              },
              {
                value: EmbeddingModels.TEXT_EMBEDDINGS_SMALL as string,
              },
              {
                value: EmbeddingModels.NONE as string,
                label: "Other",
              },
            ],
    });
    if (isCancel(embeddingModel)) {
      cancel("Will see you soon! :(");
      process.exit(1);
    }
    if (embeddingModel === LLMModels.NONE) {
      embeddingModel = await text({
        message: "Model name?",
        placeholder: "embed-model",
      });
    }
    if (isCancel(embeddingModel)) {
      cancel("Will see you soon! :(");
      process.exit(1);
    }

    outro(`Thank you ${username}. I'm fully setup, let's start 🔥`);

    /// Returns the config
    return {
      username,
      provider,
      ollamaBaseUrl,
      openAIApiKey,
      messageModel,
      embeddingModel,
    } satisfies Config;
  }
}
