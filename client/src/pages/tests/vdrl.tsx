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

export const vdrlParameters = [
  { name: "qualitative", label: "VDRL (Qualitative)", unit: "", normalRange: "Non-reactive", type: "text" as const },
  { name: "titer", label: "VDRL Titer (if reactive)", unit: "", normalRange: "N/A", type: "text" as const },
];

export default function VDRLTest() {
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
      toast({ title: "VDRL saved" });
    }
  });

  useEffect(() => { if (nextIdData?.nextId && !formData.testId) setFormData(p => ({ ...p, testId: nextIdData.nextId })); }, [nextIdData, formData.testId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.testId || !formData.patientId) { toast({ title: "Validation Error", description: "Test ID and Patient are required", variant: "destructive" }); return; }
    const patient = patients.find(p => p.patientId === formData.patientId);
    if (!patient) { toast({ title: "Patient Not Found", description: "Selected patient not found", variant: "destructive" }); return; }

    const flags: Record<string, string> = {};
    const qualitative = formData.results.qualitative || "";
    if (qualitative) flags.qualitative = qualitative.toLowerCase() === "non-reactive" ? "NORMAL" : "ABNORMAL";
    const normalRanges: Record<string, string> = { qualitative: "Non-reactive", titer: "N/A" };

    await createTestMutation.mutateAsync({
      testId: formData.testId,
      patientId: patient.id,
      testType: "VDRL",
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
    const rows: ReportRow[] = vdrlParameters.map((p: (typeof vdrlParameters)[number]) => {
      const value = formData.results[p.name] || "";
      let flag: ReportRow["flag"] = "";
      if (p.name === "qualitative" && value) flag = value.toLowerCase() === "non-reactive" ? "NORMAL" : "ABNORMAL";
      return { parameterLabel: p.label, value, normalRange: p.normalRange, flag };
    });
    printLabReport({ reportTitle: "FINAL REPORT", testId: formData.testId, testType: "VDRL", patient, rows, comments: formData.comments, minimal: true });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">VDRL (Syphilis Screening)</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New VDRL Test</CardTitle>
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
              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-2">{vdrlParameters[0].label}</Label>
                <Input type="text" value={formData.results.qualitative || ""} onChange={(e) => setFormData(p => ({ ...p, results: { ...p.results, qualitative: e.target.value } }))} placeholder={vdrlParameters[0].normalRange} />
                <p className="text-xs text-slate-500 mt-1">Normal: {vdrlParameters[0].normalRange}</p>
              </div>
              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-2">{vdrlParameters[1].label}</Label>
                <Input type="text" value={formData.results.titer || ""} onChange={(e) => setFormData(p => ({ ...p, results: { ...p.results, titer: e.target.value } }))} placeholder="e.g., 1:16" />
                <p className="text-xs text-slate-500 mt-1">Reported only if reactive</p>
              </div>
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


