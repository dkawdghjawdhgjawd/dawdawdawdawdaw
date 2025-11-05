import { Client, Message, TextChannel } from "discord.js";
import { getUncachableDiscordClient } from "./discord-client";
import { analyzeMessage } from "./openai-client";
import { storage } from "./storage";
import type { WebSocket } from "ws";

let botClient: Client | null = null;
let connectedClients: Set<WebSocket> = new Set();

export function addWebSocketClient(ws: WebSocket) {
  connectedClients.add(ws);
  ws.on("close", () => {
    connectedClients.delete(ws);
  });
}

function broadcastLog(log: any) {
  const message = JSON.stringify({ type: "new_log", data: log });
  connectedClients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

export async function startBot() {
  if (botClient) {
    console.log("Bot already running");
    return botClient;
  }

  try {
    botClient = await getUncachableDiscordClient();

    botClient.on("ready", () => {
      console.log(`Bot logged in as ${botClient!.user?.tag}`);
    });

    botClient.on("messageCreate", async (message: Message) => {
      // Ignore bot messages
      if (message.author.bot) return;

      // Get server config
      const config = await storage.getConfig(message.guildId || "");
      if (!config) return;

      // Check if monitoring all channels or specific ones
      if (!config.monitorAllChannels) {
        const monitoredChannels = config.monitoredChannels || [];
        if (!monitoredChannels.includes(message.channelId)) return;
      }

      // Analyze message with AI
      const analysis = await analyzeMessage(
        message.content,
        config.sensitivity || "medium"
      );

      // If violation detected, take action
      if (analysis.isViolation) {
        const log = await storage.createLog({
          serverId: message.guildId || "",
          serverName: message.guild?.name || "Unknown Server",
          userId: message.author.id,
          username: message.author.username,
          userAvatar: message.author.displayAvatarURL(),
          channelId: message.channelId,
          channelName: (message.channel as TextChannel).name || "Unknown Channel",
          messageContent: message.content,
          violationType: analysis.violationType,
          confidenceScore: analysis.confidenceScore,
          aiReasoning: analysis.reasoning,
          actionTaken: "logged",
        });

        // Broadcast to connected WebSocket clients
        broadcastLog(log);

        // Execute configured actions
        let actionsTaken: string[] = [];

        // Warn user
        if (config.enableWarn && config.warnMessage) {
          try {
            await message.author.send(config.warnMessage);
            actionsTaken.push("warned");
          } catch (error) {
            console.error("Failed to send warning DM:", error);
          }
        }

        // Log to channel
        if (config.enableLog && config.logChannelId) {
          try {
            const logChannel = await message.guild?.channels.fetch(config.logChannelId) as TextChannel;
            if (logChannel) {
              await logChannel.send({
                embeds: [{
                  title: "🚨 Moderation Alert",
                  description: `**User:** ${message.author.tag}\n**Channel:** ${(message.channel as TextChannel).name}\n**Violation:** ${analysis.violationType}\n**Confidence:** ${analysis.confidenceScore}%\n**Reasoning:** ${analysis.reasoning}`,
                  color: 0xff0000,
                  timestamp: new Date().toISOString(),
                }]
              });
              actionsTaken.push("logged");
            }
          } catch (error) {
            console.error("Failed to log to channel:", error);
          }
        }

        // Kick user
        if (config.enableKick) {
          try {
            const member = message.guild?.members.cache.get(message.author.id);
            if (member) {
              await member.kick(`Automated moderation: ${analysis.violationType}`);
              actionsTaken.push("kicked");
            }
          } catch (error) {
            console.error("Failed to kick user:", error);
          }
        }

        // Ban user
        if (config.enableBan) {
          try {
            const member = message.guild?.members.cache.get(message.author.id);
            if (member) {
              await member.ban({ 
                reason: `Automated moderation: ${analysis.violationType}`,
                deleteMessageSeconds: 86400, // Delete messages from last day
              });
              actionsTaken.push("banned");
            }
          } catch (error) {
            console.error("Failed to ban user:", error);
          }
        }

        // Custom command
        if (config.customCommand) {
          try {
            // Parse and execute custom command (simplified version)
            const commandText = config.customCommand
              .replace("@user", `<@${message.author.id}>`)
              .replace("@channel", `<#${message.channelId}>`);
            await message.channel.send(commandText);
            actionsTaken.push("custom");
          } catch (error) {
            console.error("Failed to execute custom command:", error);
          }
        }

        // Update log with actions taken
        if (actionsTaken.length > 0) {
          log.actionTaken = actionsTaken.join(", ");
        }

        // Delete the offending message
        try {
          await message.delete();
        } catch (error) {
          console.error("Failed to delete message:", error);
        }
      }
    });

    botClient.on("error", (error) => {
      console.error("Discord bot error:", error);
    });

    return botClient;
  } catch (error) {
    console.error("Failed to start bot:", error);
    botClient = null;
    throw error;
  }
}

export async function stopBot() {
  if (botClient) {
    await botClient.destroy();
    botClient = null;
    console.log("Bot stopped");
  }
}

export function getBotClient(): Client | null {
  return botClient;
}
