import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { 
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
  { 
    name: "Urine Analysis", 
    href: "/tests/urine", 
    icon: Eye, 
    description: "Complete urinalysis",
    color: "bg-cyan-100 text-cyan-600"
  },
  { 
    name: "Cardiac Markers", 
    href: "/tests/cardiac", 
    icon: Heart, 
    description: "Heart function analysis",
    color: "bg-rose-100 text-rose-600"
  },
  { 
    name: "Electrolytes", 
    href: "/tests/electrolytes", 
    icon: Zap, 
    description: "Ion balance analysis",
    color: "bg-orange-100 text-orange-600"
  },
];

export default function TestNavigation() {
  return (
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
  );
}
