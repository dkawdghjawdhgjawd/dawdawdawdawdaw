import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Save, AlertCircle, CheckCircle2 } from "lucide-react";
import type { ModConfig, ServerInfo, SensitivityLevel } from "@shared/schema";

export default function Settings() {
  const { toast } = useToast();
  const [selectedServerId, setSelectedServerId] = useState<string>("");

  const { data: servers } = useQuery<ServerInfo[]>({
    queryKey: ["/api/servers"],
  });

  const { data: config, isLoading } = useQuery<ModConfig>({
    queryKey: ["/api/config", selectedServerId],
    queryFn: selectedServerId ? () => 
      fetch(`/api/config/${selectedServerId}`).then(res => res.json()) : undefined,
    enabled: !!selectedServerId,
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<ModConfig>) =>
      apiRequest("POST", "/api/config", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({
        title: "Settings saved",
        description: "Your moderation configuration has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error saving settings",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const sensitivityLevels: Record<SensitivityLevel, { label: string; description: string; value: number }> = {
    low: { label: "Low", description: "Only flag obvious violations", value: 0 },
    medium: { label: "Medium", description: "Balanced detection", value: 33 },
    high: { label: "High", description: "Strict monitoring", value: 66 },
    strict: { label: "Strict", description: "Maximum sensitivity", value: 100 },
  };

  const getSensitivityFromValue = (value: number): SensitivityLevel => {
    if (value <= 16) return "low";
    if (value <= 50) return "medium";
    if (value <= 83) return "high";
    return "strict";
  };

  const [localConfig, setLocalConfig] = useState<Partial<ModConfig>>({});

  const currentSensitivity = localConfig.sensitivity || config?.sensitivity || "medium";
  const sliderValue = sensitivityLevels[currentSensitivity as SensitivityLevel].value;

  const handleSave = () => {
    if (!selectedServerId) return;
    const serverName = servers?.find(s => s.id === selectedServerId)?.name || "";
    
    // Merge with existing config and ensure all required fields
    const completeConfig = {
      serverId: selectedServerId,
      serverName,
      sensitivity: localConfig.sensitivity ?? config?.sensitivity ?? "medium",
      primaryAction: localConfig.primaryAction ?? config?.primaryAction ?? "log",
      enableWarn: localConfig.enableWarn ?? config?.enableWarn ?? false,
      warnMessage: localConfig.warnMessage ?? config?.warnMessage ?? null,
      enableLog: localConfig.enableLog ?? config?.enableLog ?? true,
      logChannelId: localConfig.logChannelId ?? config?.logChannelId ?? null,
      enableKick: localConfig.enableKick ?? config?.enableKick ?? false,
      enableBan: localConfig.enableBan ?? config?.enableBan ?? false,
      banDuration: localConfig.banDuration ?? config?.banDuration ?? null,
      customCommand: localConfig.customCommand ?? config?.customCommand ?? null,
      monitoredChannels: localConfig.monitoredChannels ?? config?.monitoredChannels ?? [],
      monitorAllChannels: localConfig.monitorAllChannels ?? config?.monitorAllChannels ?? true,
    };
    
    saveMutation.mutate(completeConfig);
  };

  const updateConfig = (updates: Partial<ModConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
  };

  const selectedServer = servers?.find(s => s.id === selectedServerId);
  const displayConfig = { ...config, ...localConfig };

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div>
        <h1 className="text-4xl font-bold" data-testid="text-settings-title">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure AI detection sensitivity and automated moderation actions
        </p>
      </div>

      {/* Server Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Server</CardTitle>
          <CardDescription>
            Choose which Discord server to configure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedServerId} onValueChange={setSelectedServerId}>
            <SelectTrigger data-testid="select-server">
              <SelectValue placeholder="Select a server" />
            </SelectTrigger>
            <SelectContent>
              {servers?.map((server) => (
                <SelectItem key={server.id} value={server.id} data-testid={`server-${server.id}`}>
                  {server.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedServerId && !isLoading && (
        <>
          {/* Detection Sensitivity */}
          <Card>
            <CardHeader>
              <CardTitle>Detection Sensitivity</CardTitle>
              <CardDescription>
                Adjust how strictly the AI evaluates messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Sensitivity Level</Label>
                  <span className="text-sm font-semibold text-primary" data-testid="text-sensitivity-level">
                    {sensitivityLevels[currentSensitivity as SensitivityLevel].label}
                  </span>
                </div>
                <Slider
                  value={[sliderValue]}
                  onValueChange={([value]) => {
                    const newSensitivity = getSensitivityFromValue(value);
                    updateConfig({ sensitivity: newSensitivity });
                  }}
                  max={100}
                  step={33}
                  className="w-full"
                  data-testid="slider-sensitivity"
                />
                <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                  <span>Low</span>
                  <span className="text-center">Medium</span>
                  <span className="text-center">High</span>
                  <span className="text-right">Strict</span>
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm">
                  {sensitivityLevels[currentSensitivity as SensitivityLevel].description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Moderation Actions</CardTitle>
              <CardDescription>
                Configure what happens when a violation is detected
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Warn User */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Label className="text-base font-medium">Warn User</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Send a warning message to the user
                  </p>
                  {(displayConfig.enableWarn ?? false) && (
                    <Textarea
                      placeholder="Enter warning message..."
                      value={displayConfig.warnMessage ?? ""}
                      onChange={(e) => updateConfig({ warnMessage: e.target.value })}
                      className="mt-3"
                      rows={2}
                      data-testid="input-warn-message"
                    />
                  )}
                </div>
                <Switch
                  checked={displayConfig.enableWarn ?? false}
                  onCheckedChange={(checked) => updateConfig({ enableWarn: checked })}
                  data-testid="switch-warn"
                />
              </div>

              {/* Log Violation */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Label className="text-base font-medium">Log Violation</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Record the violation in the moderation log
                  </p>
                  {(displayConfig.enableLog ?? true) && (
                    <Select
                      value={displayConfig.logChannelId ?? ""}
                      onValueChange={(value) => updateConfig({ logChannelId: value })}
                    >
                      <SelectTrigger className="mt-3" data-testid="select-log-channel">
                        <SelectValue placeholder="Select log channel (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedServer?.channels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            #{channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <Switch
                  checked={displayConfig.enableLog ?? true}
                  onCheckedChange={(checked) => updateConfig({ enableLog: checked })}
                  data-testid="switch-log"
                />
              </div>

              {/* Kick User */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Label className="text-base font-medium">Kick User</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Remove user from the server temporarily
                  </p>
                </div>
                <Switch
                  checked={displayConfig.enableKick ?? false}
                  onCheckedChange={(checked) => updateConfig({ enableKick: checked })}
                  data-testid="switch-kick"
                />
              </div>

              {/* Ban User */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Label className="text-base font-medium">Ban User</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Permanently or temporarily ban the user
                  </p>
                  {(displayConfig.enableBan ?? false) && (
                    <Input
                      type="number"
                      placeholder="Ban duration (hours, leave empty for permanent)"
                      value={displayConfig.banDuration ?? ""}
                      onChange={(e) => updateConfig({ banDuration: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="mt-3"
                      data-testid="input-ban-duration"
                    />
                  )}
                </div>
                <Switch
                  checked={displayConfig.enableBan ?? false}
                  onCheckedChange={(checked) => updateConfig({ enableBan: checked })}
                  data-testid="switch-ban"
                />
              </div>

              {/* Custom Command */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Label className="text-base font-medium">Execute Custom Command</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Run a command from another bot
                  </p>
                  <Input
                    placeholder="!timeout @user 10m"
                    value={displayConfig.customCommand ?? ""}
                    onChange={(e) => updateConfig({ customCommand: e.target.value })}
                    className="mt-3"
                    data-testid="input-custom-command"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Channel Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Channel Monitoring</CardTitle>
              <CardDescription>
                Select which channels to monitor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Monitor All Channels</Label>
                <Switch
                  checked={displayConfig.monitorAllChannels ?? true}
                  onCheckedChange={(checked) => updateConfig({ monitorAllChannels: checked })}
                  data-testid="switch-monitor-all"
                />
              </div>
              {!displayConfig.monitorAllChannels && (
                <div className="space-y-2 pt-2">
                  <Label className="text-sm text-muted-foreground">
                    Select specific channels (feature coming soon)
                  </Label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              size="lg"
              data-testid="button-save-settings"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Configuration"}
            </Button>
            {saveMutation.isSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Saved successfully</span>
              </div>
            )}
            {saveMutation.isError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>Failed to save</span>
              </div>
            )}
          </div>
        </>
      )}

      {selectedServerId && isLoading && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Loading configuration...
          </CardContent>
        </Card>
      )}

      {!selectedServerId && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium mb-1">No Server Selected</h3>
            <p className="text-sm text-muted-foreground">
              Please select a server to configure moderation settings
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
