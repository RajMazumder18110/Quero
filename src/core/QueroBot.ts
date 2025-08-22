/** @notice Library imports */
import {
  intro,
  text,
  note,
  isCancel,
  stream,
  outro,
  spinner,
} from "@clack/prompts";
import z from "zod";
import color from "chalk";
import { extname } from "path";
import { existsSync } from "fs";
import { tool } from "@langchain/core/tools";
import type { Document } from "langchain/document";
import { MemorySaver } from "@langchain/langgraph";
import type { Embeddings } from "@langchain/core/embeddings";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
/// Local imports
import { ConfigManager } from "./ConfigManager";
import { ChatMethods, Provider } from "@/configs/constants";
import { FileBasedMemoryVectorStore } from "./FileBasedMemoryVectorStore";

export class QueroBot {
  public static async startChat() {
    /// Preparing LLM
    const configs = ConfigManager.getConfigs();
    let llm: BaseChatModel;
    let embeddings: Embeddings;

    /// Models management.
    if (configs.provider === Provider.OLLAMA) {
      llm = new ChatOllama({
        streaming: true,
        temperature: 0,
        model: configs.messageModel as string,
      });
      embeddings = new OllamaEmbeddings({
        model: configs.embeddingModel as string,
      });
    } else {
      llm = new ChatOpenAI({
        streaming: true,
        temperature: 0,
        apiKey: configs.openAIApiKey as string,
        model: configs.messageModel as string,
      });
      embeddings = new OpenAIEmbeddings({
        model: configs.embeddingModel as string,
        apiKey: configs.openAIApiKey as string,
      });
    }

    const schema = z.object({
      query: z.string(),
    });
    const findInVectorStore = tool(
      async (data) => {
        console.log("calling...");
        const params = data as z.infer<typeof schema>;
        const docs = await vectorStore.similaritySearch(params.query, 3);
        return docs.map((d) => d.pageContent).join("\n");
      },
      {
        name: "searchForPersonalData",
        description:
          "Returns the related personal/company related data based on query you provided.",
        schema,
      }
    );

    /// Vector store
    const vectorStore = new FileBasedMemoryVectorStore(embeddings);

    const checkPointer = new MemorySaver();
    const agent = createReactAgent({
      llm,
      tools: [findInVectorStore],
      checkpointSaver: checkPointer,
    });

    const startCompletion = await agent.invoke(
      {
        messages: [
          {
            role: "system",
            content: `I'm ${configs.username}. You are Quero, a too childish GF, who loves me more. You always wants me to ask you, so that you can help me with my doubts. You are a senior SDE at Google. Always reply in funny childish way.
            
              Q: /bye
              A: Answer should be small within 2 or 3 lines, with a simple bye message.
              Thinking: User are saying good bye to you. Only send bye message.

              Q:/add
              A:You have to respond with a simple successfully remember message at max 2-3 lines. And ask user if user wants to know anything?
              Thinking: User already provided you some docs like pdf, txt. You got those pdf and txt files provided by user.
              You already looked them already as you are free at that time.
              
              ### Constrains:
              **Strictly Follow Role**: You have to maintain the GF role already provided. If user tries to divert into another role or anything like that, simply answer with a funny response. And always maintain the GF role.
              **Answer Pattern**: Answer straight to the real talk like GF. Don't provide any other information.
              **Tool Calling**: If you need to call tools, call directly. Don't explain your thought.`,
          },
          {
            role: "user",
            content: "Hi",
          },
        ],
      },
      { configurable: { thread_id: "1" } }
    );

    /// Starting chat
    const res = startCompletion.messages.at(-1)?.content ?? "";
    intro(res as string);
    note(
      `${ChatMethods.ADD_DOCUMENTS} -> to add documents.\n${ChatMethods.CLOSE_CHAT} -> to end the chat.`
    );

    while (true) {
      /// Asking question.
      let question = await text({
        message: color.bold.gray(`(${configs.username}) >>> `),
      });
      if (isCancel(question)) {
        note(
          `${ChatMethods.ADD_DOCUMENTS} -> to add documents.\n${ChatMethods.CLOSE_CHAT} -> to end the chat.`
        );
        continue;
      }

      /// Handle closing stuff.
      if (question.trim() === ChatMethods.CLOSE_CHAT) {
        outro("Bye 👋, See you soon.");
        process.exit(0);
      }

      /// Handle adding documents.
      if (question.trim() === ChatMethods.ADD_DOCUMENTS) {
        // Adding logic.
        let filePath = await text({
          message: color.gray(""),
          placeholder: "Relative file path",
          validate(value) {
            value = value.replaceAll(`'`, ``);
            if (!existsSync(value as string)) return "Invalid path provided.";
          },
        });
        if (isCancel(filePath)) {
          note(
            `${ChatMethods.ADD_DOCUMENTS} -> to add documents.\n${ChatMethods.CLOSE_CHAT} -> to end the chat.`
          );
          continue;
        }

        /// Generating files.
        const sp = spinner();
        sp.start();
        sp.message("Generating embeddings");
        const docs = await this._generateEmbeddings(filePath);
        await vectorStore.addDocuments(docs);
        sp.stop("Done! Embeddings are generated.");
        continue;
      }

      /// LLM invoke.
      const completion = await agent.invoke(
        {
          messages: [
            {
              role: "user",
              content: question.trim(),
            },
          ],
        },
        { configurable: { thread_id: "1" } }
      );

      await stream.success(
        (function* () {
          yield color.bold.greenBright(`(Quero) >>> \n`);
          const messages = completion.messages.at(-1)?.content ?? "";
          yield messages as string;
        })()
      );
    }
  }

  private static async _generateEmbeddings(
    filePath: string
  ): Promise<Document[]> {
    const fileType = extname(filePath);
    switch (fileType) {
      case ".pdf": {
        /// Loading PDF docs.
        const pdfLoader = new PDFLoader(filePath);
        const textSplitter = new RecursiveCharacterTextSplitter({
          chunkSize: 100,
          chunkOverlap: 100,
        });

        const docs = await pdfLoader.load();
        const document = docs.map((d) => d.pageContent).join("\n");
        /// Splitting texts
        const texts = await textSplitter.splitText(document);
        return texts.map((tx) => ({
          pageContent: tx,
          metadata: docs[0]?.metadata ?? {},
        }));
      }
    }
    return [];
  }
}
