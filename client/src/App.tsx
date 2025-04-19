import { Switch, Route, Router as WouterRouter } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";

import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import CalendarPage from "@/pages/calendar-page";
import HabitsPage from "@/pages/habits-page";
import StatsPage from "@/pages/stats-page";
import { ProtectedRoute } from "./lib/protected-route";

function Routes() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/habits" component={HabitsPage} />
      <ProtectedRoute path="/calendar" component={CalendarPage} />
      <ProtectedRoute path="/stats" component={StatsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <AuthProvider>
        <WouterRouter>
          <Routes />
        </WouterRouter>
        <Toaster />
      </AuthProvider>
    </TooltipProvider>
  );
}

export default App;
