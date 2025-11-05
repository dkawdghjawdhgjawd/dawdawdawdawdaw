import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { startBot, addWebSocketClient, getBotClient } from "./discord-bot";
import { seedData } from "./seed-data";
import { insertModConfigSchema } from "@shared/schema";
import type { ServerInfo, ChannelInfo } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed initial data
  seedData().catch(console.error);

  // Start Discord bot
  startBot().catch(console.error);

  // Get servers (Discord guilds)
  app.get("/api/servers", async (req, res) => {
    try {
      const client = getBotClient();
      if (!client || !client.guilds) {
        return res.json([]);
      }

      const servers: ServerInfo[] = [];
      for (const [guildId, guild] of client.guilds.cache) {
        const channels: ChannelInfo[] = [];
        guild.channels.cache.forEach(channel => {
          if (channel.type === 0) { // Text channel
            channels.push({
              id: channel.id,
              name: channel.name,
              type: "text",
            });
          }
        });

        servers.push({
          id: guild.id,
          name: guild.name,
          icon: guild.iconURL() || undefined,
          channels,
        });
      }

      res.json(servers);
    } catch (error) {
      console.error("Error fetching servers:", error);
      res.status(500).json({ error: "Failed to fetch servers" });
    }
  });

  // Get config for a server
  app.get("/api/config/:serverId", async (req, res) => {
    try {
      const { serverId } = req.params;
      const config = await storage.getConfig(serverId);
      
      if (!config) {
        return res.json({
          serverId,
          sensitivity: "medium",
          primaryAction: "log",
          enableLog: true,
          monitorAllChannels: true,
        });
      }

      res.json(config);
    } catch (error) {
      console.error("Error fetching config:", error);
      res.status(500).json({ error: "Failed to fetch config" });
    }
  });

  // Create or update config
  app.post("/api/config", async (req, res) => {
    try {
      const validated = insertModConfigSchema.parse(req.body);
      const config = await storage.createOrUpdateConfig(validated);
      res.json(config);
    } catch (error) {
      console.error("Error saving config:", error);
      res.status(400).json({ error: "Invalid config data" });
    }
  });

  // Get all logs
  app.get("/api/logs", async (req, res) => {
    try {
      const logs = await storage.getLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  // Get recent logs
  app.get("/api/logs/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const logs = await storage.getRecentLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching recent logs:", error);
      res.status(500).json({ error: "Failed to fetch recent logs" });
    }
  });

  // Get dashboard stats
  app.get("/api/stats/dashboard", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Get statistics for a time range
  app.get("/api/stats", async (req, res) => {
    try {
      const { serverId, timeRange } = req.query;
      
      // Get all logs and filter by time range
      const allLogs = await storage.getLogs();
      const now = new Date();
      
      const filteredLogs = allLogs.filter(log => {
        // Filter by server if specified
        if (serverId && log.serverId !== serverId) return false;
        
        // Filter by time range
        const logDate = new Date(log.timestamp);
        const diffMs = now.getTime() - logDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        
        switch (timeRange) {
          case "24h":
            return diffDays <= 1;
          case "7d":
            return diffDays <= 7;
          case "30d":
            return diffDays <= 30;
          case "all":
          default:
            return true;
        }
      });
      
      // Aggregate statistics
      const violationsByType: Record<string, number> = {};
      const actionsByType: Record<string, number> = {};
      const violatorCounts: Record<string, { username: string, count: number }> = {};
      const dailyCounts: Record<string, number> = {};
      
      filteredLogs.forEach(log => {
        // Count violations by type
        violationsByType[log.violationType] = (violationsByType[log.violationType] || 0) + 1;
        
        // Count actions
        const actions = log.actionTaken.split(", ");
        actions.forEach(action => {
          actionsByType[action] = (actionsByType[action] || 0) + 1;
        });
        
        // Count violations per user
        if (!violatorCounts[log.userId]) {
          violatorCounts[log.userId] = { username: log.username, count: 0 };
        }
        violatorCounts[log.userId].count += 1;
        
        // Count violations per day
        const dayOfWeek = new Date(log.timestamp).getDay();
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const dayName = days[dayOfWeek];
        dailyCounts[dayName] = (dailyCounts[dayName] || 0) + 1;
      });
      
      // Format response
      const stats = {
        totalViolations: filteredLogs.length,
        violationsByType,
        actionsByType,
        topViolators: Object.entries(violatorCounts)
          .map(([userId, data]) => ({ userId, ...data }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        dailyTrends: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => ({
          date: day,
          violations: dailyCounts[day] || 0,
        })),
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    addWebSocketClient(ws);

    ws.on("message", (message) => {
      console.log("Received message:", message.toString());
    });

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });

  return httpServer;
}
