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
  { 
    name: "CRP", 
    href: "/tests/crp", 
    icon: Activity, 
    description: "C-Reactive Protein",
    color: "bg-emerald-100 text-emerald-600"
  },
  { 
    name: "Blood Group", 
    href: "/tests/blood-group", 
    icon: Droplets, 
    description: "ABO/Rh typing",
    color: "bg-sky-100 text-sky-600"
  },
  { 
    name: "ICT Malaria", 
    href: "/tests/ict-malaria", 
    icon: Zap, 
    description: "Rapid malaria antigen",
    color: "bg-lime-100 text-lime-600"
  },
  { 
    name: "LH", 
    href: "/tests/lh", 
    icon: Activity, 
    description: "Luteinizing hormone",
    color: "bg-fuchsia-100 text-fuchsia-600"
  },
  { 
    name: "Prolactin", 
    href: "/tests/prolactin", 
    icon: Activity, 
    description: "Pituitary hormone",
    color: "bg-amber-100 text-amber-600"
  },
  { 
    name: "RA Factor", 
    href: "/tests/ra-factor", 
    icon: Activity, 
    description: "Rheumatoid factor",
    color: "bg-rose-100 text-rose-600"
  },
  { 
    name: "Semen Analysis", 
    href: "/tests/semen-analysis", 
    icon: FlaskConical, 
    description: "WHO semen profile",
    color: "bg-teal-100 text-teal-600"
  },
  { 
    name: "Stool Occult Blood", 
    href: "/tests/stool-occult-blood", 
    icon: FlaskConical, 
    description: "FOBT",
    color: "bg-stone-100 text-stone-600"
  },
  { 
    name: "Stool R/E", 
    href: "/tests/stool-re", 
    icon: FlaskConical, 
    description: "Routine exam",
    color: "bg-zinc-100 text-zinc-600"
  },
  { 
    name: "Testosterone", 
    href: "/tests/testosterone", 
    icon: Activity, 
    description: "Androgen level",
    color: "bg-indigo-100 text-indigo-600"
  },
  { 
    name: "Typhidot", 
    href: "/tests/typhidot", 
    icon: Thermometer, 
    description: "S. typhi antibodies",
    color: "bg-yellow-100 text-yellow-600"
  },
  { 
    name: "VDRL", 
    href: "/tests/vdrl", 
    icon: Thermometer, 
    description: "Syphilis screening",
    color: "bg-red-100 text-red-600"
  },
  { 
    name: "Widal", 
    href: "/tests/widal", 
    icon: Thermometer, 
    description: "Typhoid agglutination",
    color: "bg-orange-100 text-orange-600"
  },
  { 
    name: "HCV", 
    href: "/tests/hcv", 
    icon: Thermometer, 
    description: "Anti-HCV",
    color: "bg-green-100 text-green-600"
  },
  { 
    name: "HIV", 
    href: "/tests/hiv", 
    icon: Thermometer, 
    description: "HIV 1/2 rapid",
    color: "bg-red-100 text-red-600"
  },
  { 
    name: "Creatinine", 
    href: "/tests/creatinine", 
    icon: FlaskConical, 
    description: "Renal marker",
    color: "bg-blue-100 text-blue-600"
  },
  { 
    name: "Bilirubin", 
    href: "/tests/bilirubin", 
    icon: FlaskConical, 
    description: "Total/Direct/Indirect",
    color: "bg-yellow-100 text-yellow-600"
  },
  { 
    name: "HBsAg", 
    href: "/tests/hbsag", 
    icon: Thermometer, 
    description: "Hep B surface antigen",
    color: "bg-cyan-100 text-cyan-600"
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
