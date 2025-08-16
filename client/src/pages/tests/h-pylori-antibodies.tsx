import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { InsertTest, Patient } from "@shared/schema";
import { Edit3, Printer } from "lucide-react";
import EditIdModal from "@/components/modals/edit-id-modal";
import { printLabReport, type ReportRow } from "@/lib/printReport";

const params = [
  { name: "igg", label: "H. pylori IgG", unit: "U/mL", cutoff: 10 },
  { name: "igm", label: "H. pylori IgM", unit: "U/mL", cutoff: 10 },
  { name: "iga", label: "H. pylori IgA", unit: "U/mL", cutoff: 10 },
] as const;

type ParamName = typeof params[number]["name"];

export default function HPyloriAntibodiesTest() {
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
      toast({ title: "H. pylori Antibodies test saved" });
    }
  });

  useEffect(() => { if (nextIdData?.nextId && !formData.testId) setFormData(p => ({ ...p, testId: nextIdData.nextId })); }, [nextIdData, formData.testId]);

  const evalFlag = (name: ParamName, valueStr: string): ReportRow["flag"] => {
    const spec = params.find(p => p.name === name)!;
    const v = parseFloat(valueStr);
    if (isNaN(v)) return "";
    return v < spec.cutoff ? "NORMAL" : "HIGH"; // Below cutoff Negative, Above/Equal Positive
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.testId || !formData.patientId) { toast({ title: "Validation Error", description: "Test ID and Patient are required", variant: "destructive" }); return; }
    const patient = patients.find(p => p.patientId === formData.patientId);
    if (!patient) { toast({ title: "Patient Not Found", description: "Selected patient not found", variant: "destructive" }); return; }

    const flags: Record<string, string> = {};
    params.forEach(p => {
      const val = formData.results[p.name] || "";
      const f = evalFlag(p.name, val);
      if (f) flags[p.name] = f;
    });
    const normalRanges: Record<string, string> = Object.fromEntries(params.map(p => [p.name, `<${p.cutoff} ${p.unit}`]));

    await createTestMutation.mutateAsync({
      testId: formData.testId,
      patientId: patient.id,
      testType: "H. pylori Antibodies (IgG/IgM/IgA)",
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
    const rows: ReportRow[] = params.map(p => {
      const value = formData.results[p.name] || "";
      const flag = evalFlag(p.name, value);
      return {
        parameterLabel: p.label,
        value: value,
        unit: p.unit,
        normalRange: `<${p.cutoff} ${p.unit}`,
        flag
      };
    });

    printLabReport({
      reportTitle: "FINAL REPORT",
      testId: formData.testId,
      testType: "H. pylori Antibodies (IgG/IgM/IgA)",
      patient,
      rows,
      comments: formData.comments,
      minimal: true
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">H. pylori Antibodies (IgG/IgM/IgA)</h1>
        <p className="text-slate-600">Quantitative antibodies with standard cutoffs (method-dependent)</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New H. pylori Antibodies Test</CardTitle>
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
              {params.map(p => (
                <div key={p.name}>
                  <Label className="block text-sm font-medium text-slate-700 mb-2">{p.label}</Label>
                  <div className="flex">
                    <Input type="number" step="0.1" value={formData.results[p.name] || ""} onChange={(e) => setFormData(prev => ({ ...prev, results: { ...prev.results, [p.name]: e.target.value } }))} className="flex-1 rounded-r-none" placeholder={`<${p.cutoff}`} />
                    <span className="px-3 py-2 bg-slate-50 border border-l-0 border-slate-300 rounded-r-lg text-sm text-slate-600">{p.unit}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Negative: &lt;{p.cutoff} {p.unit}. Positive: ≥{p.cutoff} {p.unit}</p>
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
