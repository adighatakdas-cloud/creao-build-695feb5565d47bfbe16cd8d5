import React, { useState, useEffect } from "react";
import { StartupAnimation } from "./StartupAnimation";
import { Onboarding } from "./Onboarding";
import { TrafficOptimizer } from "./TrafficOptimizer";
import { UserSettingsPanel } from "./UserSettings";
import { DeveloperDashboard } from "./DeveloperDashboard";
import { userStore, useUserStore } from "@/lib/user-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  User,
  Home,
  Briefcase,
  MapPin,
  ChevronDown,
  Navigation,
  Sparkles,
  Star,
  Brain
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function AppWrapper() {
  const userState = useUserStore();
  const [showStartupAnimation, setShowStartupAnimation] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDevDashboard, setShowDevDashboard] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Check URL for dev dashboard access (?dev=1 or ?dashboard=1)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('dev') === '1' || urlParams.get('dashboard') === '1') {
      setShowDevDashboard(true);
      setShowStartupAnimation(false); // Skip animation for dev access
    }
  }, []);

  // Check if onboarding is needed after startup animation
  useEffect(() => {
    if (!showStartupAnimation) {
      const state = userStore.getState();
      if (!state.onboarding.completed) {
        setShowOnboarding(true);
      }
      setIsLoaded(true);
    }
  }, [showStartupAnimation]);

  const handleStartupComplete = () => {
    setShowStartupAnimation(false);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Show developer dashboard if accessed via URL parameter
  if (showDevDashboard) {
    return <DeveloperDashboard />;
  }

  // Show startup animation first
  if (showStartupAnimation) {
    return <StartupAnimation onComplete={handleStartupComplete} minDuration={2500} />;
  }

  // Show loading state briefly
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4 animate-pulse">
            <Navigation className="h-8 w-8 text-white" />
          </div>
          <p className="text-slate-400">Loading IndiFlow...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if not completed
  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Main app with header
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur border-b border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Navigation className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">IndiFlow</h1>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-400 px-1.5 py-0">
                  <Sparkles className="h-2.5 w-2.5 mr-1" />
                  AI Powered
                </Badge>
                <span className="text-xs text-slate-500">{userState.settings.defaultCity}</span>
              </div>
            </div>
          </div>

          {/* Quick Access */}
          <div className="flex items-center gap-2">
            {/* Saved Locations Quick Access */}
            {(userState.savedLocations.length > 0) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                    <MapPin className="h-4 w-4 mr-1" />
                    Quick
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 w-56">
                  <DropdownMenuLabel className="text-slate-400">Saved Locations</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  {userState.savedLocations.map((location) => (
                    <DropdownMenuItem
                      key={location.id}
                      className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {location.type === 'home' && <Home className="h-4 w-4 text-green-400" />}
                        {location.type === 'work' && <Briefcase className="h-4 w-4 text-blue-400" />}
                        {location.type === 'favorite' && <Star className="h-4 w-4 text-yellow-400" />}
                        {location.type === 'recent' && <MapPin className="h-4 w-4 text-slate-400" />}
                        <span>{location.name}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {(userState.profile?.name || "U")[0].toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 w-48">
                <DropdownMenuLabel className="text-slate-400">
                  {userState.profile?.name || "User"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem
                  onClick={() => setShowSettings(true)}
                  className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    userStore.resetOnboarding();
                    setShowOnboarding(true);
                  }}
                  className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <User className="h-4 w-4 mr-2" />
                  Restart Setup
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <TrafficOptimizer />
      </main>

      {/* Settings Panel */}
      <UserSettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

export default AppWrapper;
