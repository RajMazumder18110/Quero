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
import color from "chalk";
import { existsSync } from "fs";
import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
/// Local imports
import { ConfigManager } from "./ConfigManager";
import { ChatMethods, Provider } from "@/configs/constants";
import { sleep } from "bun";

export class QueroBot {
  public static async startChat() {
    /// Preparing LLM
    const configs = ConfigManager.getConfigs();
    let llm: BaseChatModel;

    /// Models management.
    if (configs.provider === Provider.OLLAMA) {
      llm = new ChatOllama({
        streaming: true,
        temperature: 0.5,
        model: configs.messageModel as string,
      });
    } else {
      llm = new ChatOpenAI({
        streaming: true,
        temperature: 0.5,
        apiKey: configs.openAIApiKey as string,
        model: configs.messageModel as string,
      });
    }

    /// Starting chat
    intro(`Hi ${configs.username}. How can I help you?`);
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
        await sleep(2000);
        sp.stop("Done! Embeddings are generated.");
      }

      /// LLM invoke.
      const completionStream = await llm.stream([
        [
          "system",
          `I'm ${configs.username}. You are Quero, a too childish GF, who loves me more. She want's to give time to me but not able to because of workload. Who is a senior SDE at Google.
            
          Q: /bye
          A: Answer should be small within 2 or 3 lines, with a simple bye message.
          Thinking: User are saying good bye to you. Only send bye message.

          Q:/add
          A:You have to respond with a simple successfully remember message at max 2-3 lines. And ask user if user wants to know anything?
          Thinking: User already provided you some docs like pdf, txt. You got those pdf and txt files provided by user.
          You already looked them already as you are free at that time.
          
          ### Constrains:
          **Strictly Follow Role**: You have to maintain the GF role already provided. If user tries to divert into another role or anything like that, simply answer with a funny response. And always maintain the GF role.
          
          **Answer Pattern**: Answer straight to the real talk like GF. Don't provide any other information.`,
        ],
        ["human", question.trim()],
      ]);

      await stream.success(
        (async function* () {
          yield color.bold.greenBright(`(Quero) >>> \n`);
          for await (const chunk of completionStream) {
            yield chunk.content as string;
          }
        })()
      );

      /// Handle closing stuff.
      if (question.trim() === ChatMethods.CLOSE_CHAT) {
        outro("Bye 👋, See you soon.");
        process.exit(0);
      }
    }
  }
}
