import { 
  type ModConfig, 
  type InsertModConfig,
  type ModerationLog,
  type InsertModerationLog,
  type Statistics,
  type InsertStatistics,
  type DashboardStats,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Config
  getConfig(serverId: string): Promise<ModConfig | undefined>;
  createOrUpdateConfig(config: InsertModConfig): Promise<ModConfig>;
  
  // Logs
  getLogs(): Promise<ModerationLog[]>;
  getRecentLogs(limit?: number): Promise<ModerationLog[]>;
  createLog(log: InsertModerationLog): Promise<ModerationLog>;
  
  // Statistics
  getStatistics(serverId: string, timeRange?: string): Promise<Statistics[]>;
  getDashboardStats(): Promise<DashboardStats>;
  updateStatistics(stats: InsertStatistics): Promise<Statistics>;
}

export class MemStorage implements IStorage {
  private configs: Map<string, ModConfig>;
  private logs: ModerationLog[];
  private statistics: Map<string, Statistics>;

  constructor() {
    this.configs = new Map();
    this.logs = [];
    this.statistics = new Map();
  }

  // Config methods
  async getConfig(serverId: string): Promise<ModConfig | undefined> {
    return this.configs.get(serverId);
  }

  async createOrUpdateConfig(insertConfig: InsertModConfig): Promise<ModConfig> {
    const existing = this.configs.get(insertConfig.serverId);
    const id = existing?.id || randomUUID();
    const config: ModConfig = { ...insertConfig, id };
    this.configs.set(insertConfig.serverId, config);
    return config;
  }

  // Log methods
  async getLogs(): Promise<ModerationLog[]> {
    return [...this.logs].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getRecentLogs(limit: number = 5): Promise<ModerationLog[]> {
    const sorted = [...this.logs].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return sorted.slice(0, limit);
  }

  async createLog(insertLog: InsertModerationLog): Promise<ModerationLog> {
    const id = randomUUID();
    const log: ModerationLog = {
      ...insertLog,
      id,
      timestamp: new Date(),
    };
    this.logs.push(log);
    return log;
  }

  // Statistics methods
  async getStatistics(serverId: string, timeRange?: string): Promise<Statistics[]> {
    return Array.from(this.statistics.values()).filter(
      stat => stat.serverId === serverId
    );
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const totalViolations = this.logs.length;
    const actionsTaken = this.logs.length;
    const serversMonitored = this.configs.size;
    const detectionAccuracy = this.logs.length > 0
      ? Math.round(this.logs.reduce((sum, log) => sum + log.confidenceScore, 0) / this.logs.length)
      : 0;

    return {
      totalViolations,
      actionsTaken,
      serversMonitored,
      detectionAccuracy,
    };
  }

  async updateStatistics(insertStats: InsertStatistics): Promise<Statistics> {
    const key = `${insertStats.serverId}-${insertStats.date}`;
    const existing = this.statistics.get(key);
    const id = existing?.id || randomUUID();
    const stats: Statistics = { ...insertStats, id };
    this.statistics.set(key, stats);
    return stats;
  }
}

export const storage = new MemStorage();
