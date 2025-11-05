import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Activity, Target, Settings, ScrollText, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import type { DashboardStats, ModerationLog } from "@shared/schema";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats/dashboard"],
  });

  const { data: recentLogs, isLoading: logsLoading } = useQuery<ModerationLog[]>({
    queryKey: ["/api/logs/recent"],
  });

  const statCards = [
    {
      title: "Total Violations",
      value: stats?.totalViolations || 0,
      icon: AlertTriangle,
      description: "Detected this month",
      color: "text-destructive",
      testId: "stat-violations",
    },
    {
      title: "Actions Taken",
      value: stats?.actionsTaken || 0,
      icon: Activity,
      description: "Automated responses",
      color: "text-primary",
      testId: "stat-actions",
    },
    {
      title: "Servers Monitored",
      value: stats?.serversMonitored || 0,
      icon: Shield,
      description: "Active protection",
      color: "text-chart-3",
      testId: "stat-servers",
    },
    {
      title: "Detection Accuracy",
      value: `${stats?.detectionAccuracy || 0}%`,
      icon: Target,
      description: "AI confidence",
      color: "text-chart-2",
      testId: "stat-accuracy",
    },
  ];

  const quickActions = [
    {
      title: "Configure Detection",
      description: "Adjust AI sensitivity and moderation rules",
      icon: Settings,
      href: "/settings",
      testId: "action-configure",
    },
    {
      title: "View Logs",
      description: "Browse detailed moderation history",
      icon: ScrollText,
      href: "/logs",
      testId: "action-logs",
    },
    {
      title: "View Statistics",
      description: "Analyze trends and patterns",
      icon: TrendingUp,
      href: "/statistics",
      testId: "action-statistics",
    },
  ];

  const getViolationBadgeColor = (type: string) => {
    const colors = {
      toxicity: "bg-destructive/10 text-destructive border-destructive/20",
      harassment: "bg-chart-5/10 text-chart-5 border-chart-5/20",
      spam: "bg-chart-4/10 text-chart-4 border-chart-4/20",
      inappropriate: "bg-chart-2/10 text-chart-2 border-chart-2/20",
      hate_speech: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return colors[type as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor your Discord servers with AI-powered moderation
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} data-testid={stat.testId}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid={`${stat.testId}-value`}>
                  {statsLoading ? "..." : stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href}>
                <Card className="hover-elevate cursor-pointer transition-all" data-testid={action.testId}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{action.title}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {action.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Recent Activity</h2>
          <Link href="/logs">
            <Button variant="outline" size="sm" data-testid="button-view-all-logs">
              View All
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-0">
            {logsLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading recent activity...
              </div>
            ) : !recentLogs || recentLogs.length === 0 ? (
              <div className="p-8 text-center">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-medium mb-1">No violations detected</h3>
                <p className="text-sm text-muted-foreground">
                  Your community is following the rules. Great job!
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {recentLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="p-4 flex items-start gap-4 hover-elevate"
                    data-testid={`log-${log.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium" data-testid={`log-username-${log.id}`}>
                          {log.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          in #{log.channelName}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {log.messageContent}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-md border font-medium ${getViolationBadgeColor(log.violationType)}`}>
                          {log.violationType.replace("_", " ")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {log.confidenceScore}% confidence
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
