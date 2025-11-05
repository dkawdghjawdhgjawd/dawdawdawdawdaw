import { storage } from "./storage";

export async function seedData() {
  console.log("Seeding initial data...");

  // Create some sample moderation logs
  await storage.createLog({
    serverId: "123456789",
    serverName: "Example Server",
    userId: "user001",
    username: "ToxicUser123",
    userAvatar: null,
    channelId: "channel001",
    channelName: "general",
    messageContent: "You're all terrible and I hate this place!",
    violationType: "toxicity",
    confidenceScore: 87,
    aiReasoning: "Message contains hostile and disrespectful language directed at community members.",
    actionTaken: "warned, logged",
  });

  await storage.createLog({
    serverId: "123456789",
    serverName: "Example Server",
    userId: "user002",
    username: "SpamBot42",
    userAvatar: null,
    channelId: "channel001",
    channelName: "general",
    messageContent: "BUY CRYPTO NOW! CLICK HERE! LIMITED TIME OFFER! 🚀🚀🚀",
    violationType: "spam",
    confidenceScore: 95,
    aiReasoning: "Message is clearly promotional spam with excessive capitalization and emojis.",
    actionTaken: "kicked, logged",
  });

  await storage.createLog({
    serverId: "123456789",
    serverName: "Example Server",
    userId: "user003",
    username: "BullyKing",
    userAvatar: null,
    channelId: "channel002",
    channelName: "off-topic",
    messageContent: "@newbie you're so stupid, why don't you just leave",
    violationType: "harassment",
    confidenceScore: 92,
    aiReasoning: "Direct targeted harassment and bullying behavior towards another user.",
    actionTaken: "banned, logged",
  });

  // Create a default config
  await storage.createOrUpdateConfig({
    serverId: "123456789",
    serverName: "Example Server",
    sensitivity: "medium",
    primaryAction: "log",
    enableWarn: true,
    warnMessage: "Your message violated our community guidelines. Please be respectful.",
    enableLog: true,
    logChannelId: "mod-log-channel",
    enableKick: false,
    enableBan: false,
    banDuration: null,
    customCommand: "",
    monitoredChannels: [],
    monitorAllChannels: true,
  });

  console.log("Seed data created successfully");
}
