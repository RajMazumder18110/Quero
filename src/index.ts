/** @notice Library imports */
import { QueroBot } from "@/core/QueroBot";
import { ConfigManager } from "@/core/ConfigManager";

console.clear();
ConfigManager.initialize();
QueroBot.startChat();
