import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Patients from "@/pages/patients";
import Reports from "@/pages/reports";
import CBCTest from "@/pages/tests/cbc";
import LFTTest from "@/pages/tests/lft";
import RFTTest from "@/pages/tests/rft";
import LipidTest from "@/pages/tests/lipid";
import SugarTest from "@/pages/tests/sugar";
import ThyroidTest from "@/pages/tests/thyroid";
import UrineTest from "@/pages/tests/urine";
import CardiacTest from "@/pages/tests/cardiac";
import ElectrolytesTest from "@/pages/tests/electrolytes";
import CoagulationTest from "@/pages/tests/coagulation";
import CRPTest from "@/pages/tests/crp";
import BloodGroupTest from "@/pages/tests/blood-group";
import ICTMalariaTest from "@/pages/tests/ict-malaria";
import LHTest from "@/pages/tests/lh";
import ProlactinTest from "@/pages/tests/prolactin";
import RAFactorTest from "@/pages/tests/ra-factor";
import SemenAnalysisTest from "@/pages/tests/semen-analysis";
import StoolOccultBloodTest from "@/pages/tests/stool-occult-blood";
import StoolRETest from "@/pages/tests/stool-re";
import TestosteroneTest from "@/pages/tests/testosterone";
import TyphidotTest from "@/pages/tests/typhidot";
import VDRLTest from "@/pages/tests/vdrl";
import WidalTest from "@/pages/tests/widal";
import HCVTest from "@/pages/tests/hcv";
import HIVTest from "@/pages/tests/hiv";
import CreatinineTest from "@/pages/tests/creatinine";
import BilirubinTest from "@/pages/tests/bilirubin";
import AmylaseTest from "@/pages/tests/amylase";
import HBsAgTest from "@/pages/tests/hbsag";
import BetaHCGUrineTest from "@/pages/tests/beta-hcg-urine";
import BetaHCGBloodTest from "@/pages/tests/beta-hcg-blood";
import HPyloriStoolAntigenTest from "@/pages/tests/h-pylori-stool-antigen";
import HPyloriAntibodiesTest from "@/pages/tests/h-pylori-antibodies";
import CustomBuilder from "@/pages/tests/custom-builder";
import Sidebar from "@/components/layout/sidebar";
import NotFound from "@/pages/not-found";

function AppContent() {
  const { user, isLoading } = useAuth();
  useKeyboardShortcuts(); // Add keyboard shortcuts support

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
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/patients" component={Patients} />
          <Route path="/reports" component={Reports} />
          <Route path="/tests/cbc" component={CBCTest} />
          <Route path="/tests/lft" component={LFTTest} />
          <Route path="/tests/rft" component={RFTTest} />
          <Route path="/tests/lipid" component={LipidTest} />
          <Route path="/tests/sugar" component={SugarTest} />
          <Route path="/tests/thyroid" component={ThyroidTest} />
          <Route path="/tests/urine" component={UrineTest} />
          <Route path="/tests/cardiac" component={CardiacTest} />
          <Route path="/tests/electrolytes" component={ElectrolytesTest} />
          <Route path="/tests/coagulation" component={CoagulationTest} />
          <Route path="/tests/crp" component={CRPTest} />
          <Route path="/tests/blood-group" component={BloodGroupTest} />
          <Route path="/tests/ict-malaria" component={ICTMalariaTest} />
          <Route path="/tests/lh" component={LHTest} />
          <Route path="/tests/prolactin" component={ProlactinTest} />
          <Route path="/tests/ra-factor" component={RAFactorTest} />
          <Route path="/tests/semen-analysis" component={SemenAnalysisTest} />
          <Route path="/tests/stool-occult-blood" component={StoolOccultBloodTest} />
          <Route path="/tests/stool-re" component={StoolRETest} />
          <Route path="/tests/testosterone" component={TestosteroneTest} />
          <Route path="/tests/typhidot" component={TyphidotTest} />
          <Route path="/tests/vdrl" component={VDRLTest} />
          <Route path="/tests/widal" component={WidalTest} />
          <Route path="/tests/hcv" component={HCVTest} />
          <Route path="/tests/hiv" component={HIVTest} />
          <Route path="/tests/creatinine" component={CreatinineTest} />
          <Route path="/tests/bilirubin" component={BilirubinTest} />
          <Route path="/tests/amylase" component={AmylaseTest} />
          <Route path="/tests/hbsag" component={HBsAgTest} />
          <Route path="/tests/beta-hcg-urine" component={BetaHCGUrineTest} />
          <Route path="/tests/beta-hcg-blood" component={BetaHCGBloodTest} />
          <Route path="/tests/h-pylori-stool-antigen" component={HPyloriStoolAntigenTest} />
          <Route path="/tests/h-pylori-antibodies" component={HPyloriAntibodiesTest} />
          <Route path="/tests/custom-builder" component={CustomBuilder} />
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
