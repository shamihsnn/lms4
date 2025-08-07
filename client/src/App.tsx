import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Patients from "@/pages/patients";
import CBCTest from "@/pages/tests/cbc";
import LFTTest from "@/pages/tests/lft";
import RFTTest from "@/pages/tests/rft";
import LipidTest from "@/pages/tests/lipid";
import SugarTest from "@/pages/tests/sugar";
import ThyroidTest from "@/pages/tests/thyroid";
import UrineTest from "@/pages/tests/urine";
import CardiacTest from "@/pages/tests/cardiac";
import ElectrolytesTest from "@/pages/tests/electrolytes";
import Sidebar from "@/components/layout/sidebar";
import NotFound from "@/pages/not-found";

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/patients" component={Patients} />
          <Route path="/tests/cbc" component={CBCTest} />
          <Route path="/tests/lft" component={LFTTest} />
          <Route path="/tests/rft" component={RFTTest} />
          <Route path="/tests/lipid" component={LipidTest} />
          <Route path="/tests/sugar" component={SugarTest} />
          <Route path="/tests/thyroid" component={ThyroidTest} />
          <Route path="/tests/urine" component={UrineTest} />
          <Route path="/tests/cardiac" component={CardiacTest} />
          <Route path="/tests/electrolytes" component={ElectrolytesTest} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
