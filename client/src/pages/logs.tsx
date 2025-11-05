import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Search, Filter, Download } from "lucide-react";
import type { ModerationLog } from "@shared/schema";

export default function Logs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const { data: logs, isLoading } = useQuery<ModerationLog[]>({
    queryKey: ["/api/logs"],
  });

  const toggleExpanded = (id: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getViolationBadgeVariant = (type: string) => {
    const variants: Record<string, string> = {
      toxicity: "bg-destructive/10 text-destructive border-destructive/20",
      harassment: "bg-chart-5/10 text-chart-5 border-chart-5/20",
      spam: "bg-chart-4/10 text-chart-4 border-chart-4/20",
      inappropriate: "bg-chart-2/10 text-chart-2 border-chart-2/20",
      hate_speech: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return variants[type] || "bg-muted text-muted-foreground";
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return "text-destructive";
    if (score >= 70) return "text-chart-4";
    return "text-muted-foreground";
  };

  const filteredLogs = logs?.filter(log => {
    const matchesSearch = searchQuery === "" ||
      log.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.messageContent.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSeverity = severityFilter === "all" ||
      log.violationType === severityFilter;
    
    return matchesSearch && matchesSeverity;
  }) || [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-bold" data-testid="text-logs-title">Moderation Logs</h1>
        <p className="text-muted-foreground mt-2">
          View and analyze all detected violations and actions taken
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user or message..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-logs"
                />
              </div>
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-severity-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="toxicity">Toxicity</SelectItem>
                <SelectItem value="harassment">Harassment</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="inappropriate">Inappropriate</SelectItem>
                <SelectItem value="hate_speech">Hate Speech</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" data-testid="button-export-logs">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading moderation logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <h3 className="font-medium mb-1">No logs found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || severityFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No violations have been detected yet"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredLogs.map((log) => {
                const isExpanded = expandedLogs.has(log.id);
                return (
                  <div key={log.id} data-testid={`log-entry-${log.id}`}>
                    <div
                      className="p-4 hover-elevate cursor-pointer"
                      onClick={() => toggleExpanded(log.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="pt-1">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 grid gap-3 lg:grid-cols-[1fr_200px_120px_150px]">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium" data-testid={`log-username-${log.id}`}>
                                {log.username}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                in #{log.channelName}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {log.messageContent}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={`text-xs border ${getViolationBadgeVariant(log.violationType)}`}
                              data-testid={`badge-violation-${log.id}`}
                            >
                              {log.violationType.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="flex items-center">
                            <span className={`text-sm font-medium ${getConfidenceColor(log.confidenceScore)}`}>
                              {log.confidenceScore}% confident
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {log.actionTaken}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 pl-12 border-t bg-muted/30">
                        <div className="pt-4 space-y-3">
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">
                              Full Message
                            </Label>
                            <p className="text-sm mt-1">{log.messageContent}</p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">
                              AI Analysis
                            </Label>
                            <p className="text-sm mt-1 text-muted-foreground">
                              {log.aiReasoning}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                              <Label className="text-xs font-medium text-muted-foreground">
                                Server
                              </Label>
                              <p className="text-sm mt-1">{log.serverName}</p>
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-muted-foreground">
                                User ID
                              </Label>
                              <p className="text-sm mt-1 font-mono">{log.userId}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}
