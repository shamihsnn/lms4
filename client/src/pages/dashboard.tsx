import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  CheckCircle, 
  Users, 
  Clock, 
  AlertTriangle,
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
import { Footer } from "@/components/ui/footer";

interface DashboardStats {
  todayTests: number;
  totalPatients: number;
  pendingReports: number;
  criticalResults: number;
}

const testTypes = [
  { 
    name: "CBC Test", 
    href: "/tests/cbc", 
    icon: Droplets, 
    description: "Complete Blood Count analysis",
    color: "bg-red-100 text-red-600"
  },
  { 
    name: "LFT Test", 
    href: "/tests/lft", 
    icon: Heart, 
    description: "Liver Function Test",
    color: "bg-yellow-100 text-yellow-600"
  },
  { 
    name: "RFT Test", 
    href: "/tests/rft", 
    icon: FlaskConical, 
    description: "Renal Function Test",
    color: "bg-blue-100 text-blue-600"
  },
  { 
    name: "Lipid Profile", 
    href: "/tests/lipid", 
    icon: Activity, 
    description: "Cholesterol and lipid analysis",
    color: "bg-green-100 text-green-600"
  },
  { 
    name: "Blood Sugar", 
    href: "/tests/sugar", 
    icon: Pill, 
    description: "Glucose level testing",
    color: "bg-purple-100 text-purple-600"
  },
  { 
    name: "Thyroid Function", 
    href: "/tests/thyroid", 
    icon: Brain, 
    description: "TSH, T3, T4 analysis",
    color: "bg-indigo-100 text-indigo-600"
  },
];

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-8 flex-grow">
        {/* Welcome Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Welcome to AL-QASIM Clinic & Lab</h1>
            <p className="text-slate-600">Here's what's happening in your lab today.</p>
          </div>
          <Logo className="h-12 w-auto hidden sm:block" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Today's Tests</p>
                  <p className="text-2xl font-bold text-slate-800">{stats?.todayTests || 0}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Patients</p>
                  <p className="text-2xl font-bold text-slate-800">{stats?.totalPatients || 0}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Pending Reports</p>
                  <p className="text-2xl font-bold text-slate-800">{stats?.pendingReports || 0}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Critical Results</p>
                  <p className="text-2xl font-bold text-slate-800">{stats?.criticalResults || 0}</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Type Navigation */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Test Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testTypes.map((test) => (
              <Link key={test.name} href={test.href}>
                <Card className="bg-white border border-slate-200 hover:border-[var(--medical-primary)] hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-3">
                      <div className={`h-10 w-10 ${test.color} rounded-lg flex items-center justify-center`}>
                        <test.icon className="h-6 w-6" />
                      </div>
                      <h3 className="ml-3 font-semibold text-slate-800">{test.name}</h3>
                    </div>
                    <p className="text-sm text-slate-600">{test.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
