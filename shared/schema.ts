import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Moderation configuration
export const modConfigs = pgTable("mod_configs", {
  id: varchar("id").primaryKey(),
  serverId: text("server_id").notNull(),
  serverName: text("server_name").notNull(),
  sensitivity: text("sensitivity").notNull().default("medium"), // low, medium, high, strict
  primaryAction: text("primary_action").notNull().default("log"), // warn, log, kick, ban, custom
  enableWarn: boolean("enable_warn").notNull().default(false),
  warnMessage: text("warn_message"),
  enableLog: boolean("enable_log").notNull().default(true),
  logChannelId: text("log_channel_id"),
  enableKick: boolean("enable_kick").notNull().default(false),
  enableBan: boolean("enable_ban").notNull().default(false),
  banDuration: integer("ban_duration"), // in hours, null = permanent
  customCommand: text("custom_command"),
  monitoredChannels: jsonb("monitored_channels").$type<string[]>().default([]),
  monitorAllChannels: boolean("monitor_all_channels").notNull().default(true),
});

// Moderation logs
export const moderationLogs = pgTable("moderation_logs", {
  id: varchar("id").primaryKey(),
  serverId: text("server_id").notNull(),
  serverName: text("server_name").notNull(),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  userAvatar: text("user_avatar"),
  channelId: text("channel_id").notNull(),
  channelName: text("channel_name").notNull(),
  messageContent: text("message_content").notNull(),
  violationType: text("violation_type").notNull(), // toxicity, harassment, spam, inappropriate, hate_speech
  confidenceScore: integer("confidence_score").notNull(), // 0-100
  aiReasoning: text("ai_reasoning").notNull(),
  actionTaken: text("action_taken").notNull(), // warned, logged, kicked, banned, custom
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Statistics (aggregated)
export const statistics = pgTable("statistics", {
  id: varchar("id").primaryKey(),
  serverId: text("server_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  totalViolations: integer("total_violations").notNull().default(0),
  violationsByType: jsonb("violations_by_type").$type<Record<string, number>>().default({}),
  actionsByType: jsonb("actions_by_type").$type<Record<string, number>>().default({}),
  topViolators: jsonb("top_violators").$type<Array<{userId: string, username: string, count: number}>>().default([]),
});

// Insert schemas
export const insertModConfigSchema = createInsertSchema(modConfigs).omit({ id: true });
export const insertModerationLogSchema = createInsertSchema(moderationLogs).omit({ id: true, timestamp: true });
export const insertStatisticsSchema = createInsertSchema(statistics).omit({ id: true });

// Types
export type InsertModConfig = z.infer<typeof insertModConfigSchema>;
export type ModConfig = typeof modConfigs.$inferSelect;

export type InsertModerationLog = z.infer<typeof insertModerationLogSchema>;
export type ModerationLog = typeof moderationLogs.$inferSelect;

export type InsertStatistics = z.infer<typeof insertStatisticsSchema>;
export type Statistics = typeof statistics.$inferSelect;

// Frontend-only types for UI state
export type SensitivityLevel = "low" | "medium" | "high" | "strict";
export type ActionType = "warn" | "log" | "kick" | "ban" | "custom";
export type ViolationType = "toxicity" | "harassment" | "spam" | "inappropriate" | "hate_speech";

export interface DashboardStats {
  totalViolations: number;
  actionsTaken: number;
  serversMonitored: number;
  detectionAccuracy: number;
}

export interface ServerInfo {
  id: string;
  name: string;
  icon?: string;
  channels: ChannelInfo[];
}

export interface ChannelInfo {
  id: string;
  name: string;
  type: string;
}
