import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Edit3, Printer } from "lucide-react";
import { printLabReport, type ReportRow } from "@/lib/printReport";
import EditIdModal from "@/components/modals/edit-id-modal";
import type { Patient, InsertTest } from "@shared/schema";

export const semenParameters = [
  { name: "volume", label: "Volume", unit: "mL", normalRange: ">=1.5", step: "0.1", kind: "min" as const },
  { name: "concentration", label: "Sperm Concentration", unit: "million/mL", normalRange: ">=15", step: "1", kind: "min" as const },
  { name: "totalCount", label: "Total Sperm Count", unit: "million/ejaculate", normalRange: ">=39", step: "1", kind: "min" as const },
  { name: "motility", label: "Progressive Motility (PR)", unit: "%", normalRange: ">=32", step: "1", kind: "min" as const },
  { name: "totalMotility", label: "Total Motility (PR+NP)", unit: "%", normalRange: ">=40", step: "1", kind: "min" as const },
  { name: "morphology", label: "Normal Morphology", unit: "%", normalRange: ">=4", step: "1", kind: "min" as const },
  { name: "ph", label: "pH", unit: "", normalRange: "7.2-8.0", step: "0.1", kind: "range" as const },
  { name: "liquefaction", label: "Liquefaction Time", unit: "min", normalRange: "<60", step: "1", kind: "max" as const },
  { name: "viscosity", label: "Viscosity", unit: "", normalRange: "Normal", step: "", kind: "text" as const },
  { name: "appearance", label: "Appearance", unit: "", normalRange: "Gray-opalescent", step: "", kind: "text" as const },
];

export default function SemenAnalysisTest() {
  const [formData, setFormData] = useState({ testId: "", patientId: "", results: {} as Record<string, string>, comments: "" });
  const [editingTestId, setEditingTestId] = useState(false);
  const { toast } = useToast();
  const { data: nextIdData } = useQuery<{ nextId: string }>({ queryKey: ["/api/tests/next-id"] });
  const { data: patients = [] } = useQuery<Patient[]>({ queryKey: ["/api/patients"] });

  const createTestMutation = useMutation({
    mutationFn: async (data: InsertTest) => { const res = await apiRequest("POST", "/api/tests", data); return res.json(); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tests/with-patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tests/next-id"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setFormData({ testId: "", patientId: "", results: {}, comments: "" });
      toast({ title: "Semen analysis saved" });
    }
  });

  useEffect(() => { if (nextIdData?.nextId && !formData.testId) setFormData(p => ({ ...p, testId: nextIdData.nextId })); }, [nextIdData, formData.testId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.testId || !formData.patientId) { toast({ title: "Validation Error", description: "Test ID and Patient are required", variant: "destructive" }); return; }
    const patient = patients.find(p => p.patientId === formData.patientId);
    if (!patient) { toast({ title: "Patient Not Found", description: "Selected patient not found", variant: "destructive" }); return; }

    const flags: Record<string, string> = {};
    semenParameters.forEach(p => {
      const val = formData.results[p.name];
      if (!val) return;
      if (p.kind === "text") {
        flags[p.name] = val.toLowerCase() === (p.normalRange as string).toLowerCase() ? "NORMAL" : "ABNORMAL";
        return;
      }
      const v = parseFloat(val);
      if (isNaN(v)) return;
      if (p.kind === "min") flags[p.name] = v >= parseFloat((p.normalRange as string).replace(">=", "")) ? "NORMAL" : "LOW";
      else if (p.kind === "max") flags[p.name] = v <= parseFloat((p.normalRange as string).replace("<", "")) ? "NORMAL" : "HIGH";
      else if (p.kind === "range") {
        const [min, max] = (p.normalRange as string).split('-').map(parseFloat);
        flags[p.name] = v < min ? "LOW" : v > max ? "HIGH" : "NORMAL";
      }
    });
    const normalRanges: Record<string, string> = {};
    semenParameters.forEach(p => (normalRanges[p.name] = `${p.normalRange}${p.unit ? ` ${p.unit}` : ""}`));

    await createTestMutation.mutateAsync({
      testId: formData.testId,
      patientId: patient.id,
      testType: "Semen Analysis",
      testResults: formData.results,
      normalRanges,
      flags,
      status: "completed",
      performedBy: undefined,
      modifiedBy: undefined,
    });
  };

  const handlePrint = () => {
    const patient = patients.find(p => p.patientId === formData.patientId);
    const rows: ReportRow[] = semenParameters.map((p: (typeof semenParameters)[number]) => {
      const value = formData.results[p.name] || "";
      let flag: ReportRow["flag"] = "";
      if (value) {
        if (p.kind === "text") flag = value.toLowerCase() === (p.normalRange as string).toLowerCase() ? "NORMAL" : "ABNORMAL";
        else if (p.kind === "min") flag = parseFloat(value) >= parseFloat((p.normalRange as string).replace(">=", "")) ? "NORMAL" : "LOW";
        else if (p.kind === "max") flag = parseFloat(value) <= parseFloat((p.normalRange as string).replace("<", "")) ? "NORMAL" : "HIGH";
        else if (p.kind === "range") {
          const [min, max] = (p.normalRange as string).split('-').map(parseFloat);
          const v = parseFloat(value);
          flag = isNaN(v) ? "" : v < min ? "LOW" : v > max ? "HIGH" : "NORMAL";
        }
      }
      return { parameterLabel: p.label, value, unit: p.unit || undefined, normalRange: `${p.normalRange}${p.unit ? ` ${p.unit}` : ""}`, flag };
    });
    printLabReport({ reportTitle: "FINAL REPORT", testId: formData.testId, testType: "Semen Analysis", patient, rows, comments: formData.comments, minimal: true });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Semen Analysis</h1>
        <p className="text-slate-600">WHO 2010/2021 lower reference limits</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New Semen Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-2">Test ID</Label>
                <div className="flex">
                  <Input type="text" value={formData.testId} readOnly className="flex-1 rounded-r-none bg-slate-50 text-slate-600" />
                  <Button type="button" className="rounded-l-none bg-[var(--medical-primary)] hover:bg-[var(--medical-primary-dark)]" onClick={() => setEditingTestId(true)}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-2">Patient</Label>
                <Select value={formData.patientId} onValueChange={(v) => setFormData(p => ({ ...p, patientId: v }))} required>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>
                    {patients.map(p => (<SelectItem key={p.patientId} value={p.patientId}>{p.patientId} - {p.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {semenParameters.map((param: (typeof semenParameters)[number]) => (
                <div key={param.name}>
                  <Label className="block text-sm font-medium text-slate-700 mb-2">{param.label}</Label>
                  {param.kind === "text" ? (
                    <Input type="text" value={formData.results[param.name] || ""} onChange={(e) => setFormData(p => ({ ...p, results: { ...p.results, [param.name]: e.target.value } }))} placeholder={param.normalRange as string} />
                  ) : (
                    <div className="flex">
                      <Input type="number" step={param.step} value={formData.results[param.name] || ""} onChange={(e) => setFormData(p => ({ ...p, results: { ...p.results, [param.name]: e.target.value } }))} className={param.unit ? "flex-1 rounded-r-none" : "w-full"} placeholder={param.normalRange as string} />
                      {param.unit && <span className="px-3 py-2 bg-slate-50 border border-l-0 border-slate-300 rounded-r-lg text-sm text-slate-600">{param.unit}</span>}
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-1">Normal: {param.normalRange}{param.unit ? ` ${param.unit}` : ""}</p>
                </div>
              ))}
            </div>

            <div>
              <Label className="block text-sm font-medium text-slate-700 mb-2">Comments</Label>
              <Textarea rows={3} value={formData.comments} onChange={(e) => setFormData(p => ({ ...p, comments: e.target.value }))} />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={createTestMutation.isPending} className="bg-[var(--medical-primary)] hover:bg-[var(--medical-primary-dark)] text-white">{createTestMutation.isPending ? "Saving..." : "Save Results"}</Button>
              <Button type="button" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" /> Print Report</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <EditIdModal isOpen={editingTestId} onClose={() => setEditingTestId(false)} currentId={formData.testId} idType="Test" onUpdate={(newId) => setFormData(p => ({ ...p, testId: newId }))} />
    </div>
  );
}


