import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  LayoutDashboard, 
  Users, 
  FileText,
  LogOut,
  Droplets,
  Heart,
  Zap,
  Activity,
  Pill,
  Brain,
  Eye,
  Thermometer,
  FlaskConical
} from "lucide-react";
import Logo from "@/components/brand/logo";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Reports", href: "/reports", icon: FileText },
];

const testNavigation = [
  { name: "CBC Test", href: "/tests/cbc", icon: Droplets },
  { name: "LFT Test", href: "/tests/lft", icon: Heart },
  { name: "RFT Test", href: "/tests/rft", icon: FlaskConical },
  { name: "Lipid Profile", href: "/tests/lipid", icon: Activity },
  { name: "Blood Sugar", href: "/tests/sugar", icon: Pill },
  { name: "Thyroid Function", href: "/tests/thyroid", icon: Brain },
  { name: "Urine Analysis", href: "/tests/urine", icon: Eye },
  { name: "Cardiac Markers", href: "/tests/cardiac", icon: Heart },
  { name: "Electrolytes", href: "/tests/electrolytes", icon: Zap },
  { name: "Coagulation", href: "/tests/coagulation", icon: Thermometer },
  { name: "CRP", href: "/tests/crp", icon: Activity },
  { name: "Blood Group", href: "/tests/blood-group", icon: Droplets },
  { name: "ICT Malaria", href: "/tests/ict-malaria", icon: Zap },
  { name: "LH", href: "/tests/lh", icon: Activity },
  { name: "Prolactin", href: "/tests/prolactin", icon: Activity },
  { name: "RA Factor", href: "/tests/ra-factor", icon: Activity },
  { name: "Semen Analysis", href: "/tests/semen-analysis", icon: FlaskConical },
  { name: "Stool Occult Blood", href: "/tests/stool-occult-blood", icon: FlaskConical },
  { name: "Stool R/E", href: "/tests/stool-re", icon: FlaskConical },
  { name: "Testosterone", href: "/tests/testosterone", icon: Activity },
  { name: "Typhidot", href: "/tests/typhidot", icon: Thermometer },
  { name: "VDRL", href: "/tests/vdrl", icon: Thermometer },
  { name: "Widal", href: "/tests/widal", icon: Thermometer },
  { name: "HCV", href: "/tests/hcv", icon: Thermometer },
  { name: "HIV", href: "/tests/hiv", icon: Thermometer },
  { name: "Creatinine", href: "/tests/creatinine", icon: FlaskConical },
  { name: "Bilirubin", href: "/tests/bilirubin", icon: FlaskConical },
  { name: "HBsAg", href: "/tests/hbsag", icon: Thermometer },
  { name: "Custom Builder", href: "/tests/custom-builder", icon: FlaskConical },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of the system",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg border-r border-slate-200 z-50">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center px-6 py-4 border-b border-slate-200">
          <Logo className="h-11 w-auto" />
          <span className="ml-3 font-semibold text-slate-800">AL-QASIM Labs</span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {/* Main Navigation */}
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    isActive 
                      ? "bg-[var(--medical-primary)] text-white hover:bg-[var(--medical-primary-dark)]" 
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Button>
              </Link>
            );
          })}

          {/* Test Management Section */}
          <div className="pt-6">
            <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Test Management
            </h3>
            {testNavigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`w-full justify-start text-sm ${
                      isActive 
                        ? "bg-[var(--medical-primary)] text-white hover:bg-[var(--medical-primary-dark)]" 
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                    }`}
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Info */}
        <div className="px-4 py-4 border-t border-slate-200">
          <div className="flex items-center mb-3">
            <div className="h-8 w-8 bg-[var(--medical-primary)] rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-slate-800">{user?.username || 'Admin'}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-slate-600 hover:text-slate-800"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
