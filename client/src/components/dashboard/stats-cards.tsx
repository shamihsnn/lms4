import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle, 
  Users, 
  Clock, 
  AlertTriangle
} from "lucide-react";

interface DashboardStats {
  todayTests: number;
  totalPatients: number;
  pendingReports: number;
  criticalResults: number;
}

interface StatsCardsProps {
  stats?: DashboardStats;
  isLoading: boolean;
}

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: "Today's Tests",
      value: stats?.todayTests || 0,
      icon: CheckCircle,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Total Patients",
      value: stats?.totalPatients || 0,
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Pending Reports",
      value: stats?.pendingReports || 0,
      icon: Clock,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      title: "Critical Results",
      value: stats?.criticalResults || 0,
      icon: AlertTriangle,
      color: "bg-red-100 text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat) => (
        <Card key={stat.title} className="bg-white rounded-xl shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              </div>
              <div className={`h-12 w-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
