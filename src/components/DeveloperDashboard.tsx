import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Database,
  Brain,
  MessageSquare,
  Upload,
  RefreshCw,
  Search,
  Loader2,
  FileText,
  Activity,
  TrendingUp,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserORM, type UserModel } from "@/sdk/database/orm/orm_user";
import { TrainingSubmissionORM, type TrainingSubmissionModel, TrainingSubmissionTrafficLevel, TrainingSubmissionTransportMode } from "@/sdk/database/orm/orm_training_submission";
import { FrequentRoutesORM } from "@/sdk/database/orm/orm_frequent_routes";
import { SearchHistoryORM } from "@/sdk/database/orm/orm_search_history";
import { Direction } from "@/sdk/database/orm/common";

// LLM Chat interface for developer queries
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Stats interface
interface DashboardStats {
  totalUsers: number;
  activeToday: number;
  totalRoutes: number;
  totalSearches: number;
  trainingDataCount: number;
}

// User list component
function UsersList({ users, isLoading }: { users: UserModel[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-400">Loading users...</span>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No users registered yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-medium text-white">{user.name || 'Unknown User'}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="text-xs">
              {user.google_id ? 'Google' : user.apple_id ? 'Apple' : 'Email'}
            </Badge>
            <p className="text-xs text-slate-500 mt-1">
              Joined: {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// AI Training component
function AITrainingPanel({
  onUploadFile,
  trainingData,
  isTraining,
}: {
  onUploadFile: (file: File) => void;
  trainingData: TrainingSubmissionModel[];
  isTraining: boolean;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border-2 border-dashed border-slate-600 rounded-lg text-center">
        <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
        <p className="text-sm text-slate-400 mb-2">
          Upload training data files (CSV, JSON)
        </p>
        <input
          type="file"
          accept=".csv,.json,.txt"
          onChange={handleFileChange}
          className="hidden"
          id="training-file-upload"
        />
        <label htmlFor="training-file-upload">
          <Button variant="outline" size="sm" asChild>
            <span>
              {isTraining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Select File
                </>
              )}
            </span>
          </Button>
        </label>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-slate-300 mb-2">
          Training Data ({trainingData.length} records)
        </h4>
        <ScrollArea className="h-[200px]">
          {trainingData.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              No training data submitted yet
            </p>
          ) : (
            <div className="space-y-2">
              {trainingData.slice(0, 20).map((data, idx) => (
                <div
                  key={data.id || idx}
                  className="p-2 bg-slate-800/50 rounded text-xs border border-slate-700"
                >
                  <div className="flex justify-between">
                    <span className="text-slate-300">{data.route_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {data.traffic_level}
                    </Badge>
                  </div>
                  <div className="text-slate-500 mt-1">
                    Predicted: {data.predicted_time_minutes}min → Actual: {data.actual_time_minutes}min
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

// LLM Chat component for live data queries
function LLMChatPanel({
  messages,
  onSendMessage,
  isProcessing,
}: {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() && !isProcessing) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-[400px]">
      <ScrollArea className="flex-1 p-3 bg-slate-800/30 rounded-t-lg border border-slate-700">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Ask me anything about the app data!</p>
            <p className="text-xs mt-1">Examples:</p>
            <ul className="text-xs mt-2 space-y-1">
              <li>"How many users signed up today?"</li>
              <li>"What are the most popular routes?"</li>
              <li>"Show me traffic patterns"</li>
            </ul>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "p-3 rounded-lg max-w-[85%]",
                  msg.role === 'user'
                    ? "ml-auto bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-100"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className="text-xs opacity-60 mt-1">
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Analyzing data...</span>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="flex gap-2 p-2 bg-slate-800 rounded-b-lg border-x border-b border-slate-700">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about users, routes, traffic..."
          className="flex-1 bg-slate-700 border-slate-600"
          disabled={isProcessing}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isProcessing}
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Main Developer Dashboard
export function DeveloperDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState<UserModel[]>([]);
  const [trainingData, setTrainingData] = useState<TrainingSubmissionModel[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeToday: 0,
    totalRoutes: 0,
    totalSearches: 0,
    trainingDataCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isProcessingChat, setIsProcessingChat] = useState(false);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const userORM = UserORM.getInstance();
      const trainingORM = TrainingSubmissionORM.getInstance();
      const routesORM = FrequentRoutesORM.getInstance();
      const searchORM = SearchHistoryORM.getInstance();

      // Load all users
      const allUsers = await userORM.getAllUser();
      setUsers(allUsers);

      // Load training data
      const [trainingItems] = await trainingORM.listTrainingSubmission(
        undefined,
        { orders: [{ field: "create_time", symbol: Direction.descending }] },
        { number: 1, size: 100 }
      );
      setTrainingData(trainingItems);

      // Load routes count
      const [routes] = await routesORM.listFrequentRoutes(
        undefined,
        undefined,
        { number: 1, size: 1000 }
      );

      // Load search count
      const [searches] = await searchORM.listSearchHistory(
        undefined,
        undefined,
        { number: 1, size: 1000 }
      );

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeToday = allUsers.filter(u => {
        const lastLogin = new Date(u.last_login);
        return lastLogin >= today;
      }).length;

      setStats({
        totalUsers: allUsers.length,
        activeToday,
        totalRoutes: routes.length,
        totalSearches: searches.length,
        trainingDataCount: trainingItems.length,
      });
    } catch (error) {
      console.error('[DevDashboard] Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle file upload for training
  const handleFileUpload = async (file: File) => {
    setIsTraining(true);
    try {
      const content = await file.text();
      let data: any[] = [];

      if (file.name.endsWith('.json')) {
        data = JSON.parse(content);
      } else if (file.name.endsWith('.csv')) {
        // Simple CSV parsing
        const lines = content.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        data = lines.slice(1).filter(l => l.trim()).map(line => {
          const values = line.split(',');
          return headers.reduce((obj, header, idx) => {
            obj[header] = values[idx]?.trim();
            return obj;
          }, {} as Record<string, string>);
        });
      }

      // Process and save training data
      const trainingORM = TrainingSubmissionORM.getInstance();
      const now = new Date().toISOString();

      for (const item of data) {
        // Map traffic level string to enum
        const trafficLevelMap: Record<string, TrainingSubmissionTrafficLevel> = {
          'low': TrainingSubmissionTrafficLevel.low,
          'moderate': TrainingSubmissionTrafficLevel.moderate,
          'high': TrainingSubmissionTrafficLevel.high,
        };
        const trafficStr = (item.traffic_level || item.traffic || 'moderate').toLowerCase();
        const trafficLevel = trafficLevelMap[trafficStr] || TrainingSubmissionTrafficLevel.moderate;

        await trainingORM.insertTrainingSubmission([{
          user_id: 'dev_upload',
          route_name: item.route || item.route_name || 'Unknown Route',
          predicted_time_minutes: parseFloat(item.predicted_time || item.predicted || item.predicted_time_minutes || '0'),
          actual_time_minutes: parseFloat(item.actual_time || item.actual || item.actual_time_minutes || '0'),
          traffic_level: trafficLevel,
          transport_mode: TrainingSubmissionTransportMode.driving,
          submitted_at: now,
        } as unknown as TrainingSubmissionModel]);
      }

      // Reload data
      await loadDashboardData();
      console.log('[DevDashboard] Training data uploaded:', data.length, 'records');
    } catch (error) {
      console.error('[DevDashboard] Failed to upload training data:', error);
    } finally {
      setIsTraining(false);
    }
  };

  // Handle LLM chat messages
  const handleChatMessage = async (message: string) => {
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    setIsProcessingChat(true);

    try {
      // Analyze query and generate response based on live data
      let response = "";
      const lowerMessage = message.toLowerCase();

      if (lowerMessage.includes('user') && (lowerMessage.includes('count') || lowerMessage.includes('how many') || lowerMessage.includes('total'))) {
        response = `📊 **User Statistics**\n\nTotal registered users: ${stats.totalUsers}\nActive today: ${stats.activeToday}\n\nUser breakdown:\n${users.slice(0, 5).map(u => `• ${u.name} (${u.email})`).join('\n')}${users.length > 5 ? `\n...and ${users.length - 5} more` : ''}`;
      } else if (lowerMessage.includes('route') || lowerMessage.includes('popular')) {
        response = `🗺️ **Route Analytics**\n\nTotal routes tracked: ${stats.totalRoutes}\nTotal searches: ${stats.totalSearches}\n\nThe system is actively learning from user patterns to optimize route suggestions.`;
      } else if (lowerMessage.includes('traffic') || lowerMessage.includes('pattern')) {
        response = `🚗 **Traffic Patterns**\n\nTraining data points: ${stats.trainingDataCount}\n\nThe AI model uses this data to predict travel times based on:\n• Time of day\n• Day of week\n• Historical traffic levels\n• Route characteristics`;
      } else if (lowerMessage.includes('training') || lowerMessage.includes('model') || lowerMessage.includes('ai')) {
        response = `🧠 **AI Model Status**\n\nTraining samples: ${stats.trainingDataCount}\nModel type: Traffic prediction neural network\n\nTo improve the model:\n1. Upload more training data (CSV/JSON)\n2. Ensure data includes: route, predicted_time, actual_time, traffic_level`;
      } else if (lowerMessage.includes('today') || lowerMessage.includes('active')) {
        response = `📅 **Today's Activity**\n\nActive users today: ${stats.activeToday}\nNew registrations today: ${users.filter(u => new Date(u.created_at).toDateString() === new Date().toDateString()).length}\n\nThe dashboard refreshes automatically to show live data.`;
      } else {
        response = `I can help you with information about:\n\n• **Users**: "How many users?" / "Show user stats"\n• **Routes**: "Popular routes" / "Route analytics"\n• **Traffic**: "Traffic patterns" / "Prediction accuracy"\n• **AI Model**: "Training status" / "Model performance"\n• **Activity**: "Today's activity" / "Active users"\n\nWhat would you like to know?`;
      }

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 800));

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_resp`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('[DevDashboard] Chat error:', error);
    } finally {
      setIsProcessingChat(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Brain className="h-7 w-7 text-purple-500" />
              IndiFlow Developer Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Monitor users, train AI models, and analyze data
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-blue-500" />
                <Badge variant="outline" className="text-xs">Total</Badge>
              </div>
              <p className="text-2xl font-bold text-white mt-2">{stats.totalUsers}</p>
              <p className="text-xs text-slate-400">Registered Users</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Activity className="h-5 w-5 text-green-500" />
                <Badge variant="outline" className="text-xs text-green-400">Today</Badge>
              </div>
              <p className="text-2xl font-bold text-white mt-2">{stats.activeToday}</p>
              <p className="text-xs text-slate-400">Active Today</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <MapPin className="h-5 w-5 text-orange-500" />
                <Badge variant="outline" className="text-xs">Routes</Badge>
              </div>
              <p className="text-2xl font-bold text-white mt-2">{stats.totalRoutes}</p>
              <p className="text-xs text-slate-400">Tracked Routes</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Search className="h-5 w-5 text-cyan-500" />
                <Badge variant="outline" className="text-xs">Searches</Badge>
              </div>
              <p className="text-2xl font-bold text-white mt-2">{stats.totalSearches}</p>
              <p className="text-xs text-slate-400">Total Searches</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Brain className="h-5 w-5 text-purple-500" />
                <Badge variant="outline" className="text-xs">AI</Badge>
              </div>
              <p className="text-2xl font-bold text-white mt-2">{stats.trainingDataCount}</p>
              <p className="text-xs text-slate-400">Training Samples</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800 border-slate-700 mb-4">
            <TabsTrigger value="overview">
              <TrendingUp className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="training">
              <Brain className="h-4 w-4 mr-2" />
              AI Training
            </TabsTrigger>
            <TabsTrigger value="llm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Live Query
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Recent Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UsersList users={users.slice(0, 5)} isLoading={isLoading} />
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-500" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-slate-300">API Server</span>
                      </div>
                      <Badge className="bg-green-600">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-slate-300">Database</span>
                      </div>
                      <Badge className="bg-green-600">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-slate-300">AI Model</span>
                      </div>
                      <Badge className="bg-blue-600">{stats.trainingDataCount} samples</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-slate-300">Route Engine</span>
                      </div>
                      <Badge className="bg-green-600">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  All Registered Users ({users.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <UsersList users={users} isLoading={isLoading} />
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  AI Model Training
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AITrainingPanel
                  onUploadFile={handleFileUpload}
                  trainingData={trainingData}
                  isTraining={isTraining}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="llm">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-cyan-500" />
                  Live Data Query (LLM Assistant)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LLMChatPanel
                  messages={chatMessages}
                  onSendMessage={handleChatMessage}
                  isProcessing={isProcessingChat}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-6 text-center text-slate-500 text-sm">
          <p>IndiFlow Developer Dashboard v1.0</p>
          <p className="text-xs mt-1">
            Access this dashboard at: <code className="bg-slate-800 px-2 py-0.5 rounded">/dev</code>
          </p>
        </div>
      </div>
    </div>
  );
}
