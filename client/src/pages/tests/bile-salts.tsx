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

const parameter = { name: "bileSalts", label: "Bile Salts", unit: "µmol/L", normalRange: "0.5-10", step: "0.1" } as const;

export default function BileSaltsTest() {
  const [formData, setFormData] = useState({ testId: "", patientId: "", results: {} as Record<string, string>, comments: "" });
  const [editingTestId, setEditingTestId] = useState(false);
  const { toast } = useToast();

  const { data: nextIdData } = useQuery<{ nextId: string }>({ queryKey: ["/api/tests/next-id"] });
  const { data: patients = [] } = useQuery<Patient[]>({ queryKey: ["/api/patients"] });

  const createTestMutation = useMutation({
    mutationFn: async (data: InsertTest) => { const response = await apiRequest("POST", "/api/tests", data); return response.json(); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tests/with-patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tests/next-id"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setFormData({ testId: "", patientId: "", results: {}, comments: "" });
      toast({ title: "Bile Salts test saved", description: "Bile Salts recorded" });
    },
  });

  useEffect(() => { if (nextIdData?.nextId && !formData.testId) setFormData((p) => ({ ...p, testId: nextIdData.nextId })); }, [nextIdData, formData.testId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.testId || !formData.patientId) { toast({ title: "Validation Error", description: "Test ID and Patient are required", variant: "destructive" }); return; }
    const patient = patients.find((p) => p.patientId === formData.patientId);
    if (!patient) { toast({ title: "Patient Not Found", description: "Selected patient not found", variant: "destructive" }); return; }

    const v = parseFloat(formData.results[parameter.name] || "");
    const flags: Record<string, string> = {};
    const [lowStr, highStr] = parameter.normalRange.split("-");
    const low = parseFloat(lowStr); const high = parseFloat(highStr);
    if (!isNaN(v) && !isNaN(low) && !isNaN(high)) {
      flags[parameter.name] = v < low ? "LOW" : (v > high ? "HIGH" : "NORMAL");
    }
    const normalRanges: Record<string, string> = { [parameter.name]: `${parameter.normalRange} ${parameter.unit}` };

    await createTestMutation.mutateAsync({
      testId: formData.testId,
      patientId: patient.id,
      testType: "Bile Salts",
      testResults: formData.results,
      normalRanges,
      flags,
      status: "completed",
      performedBy: undefined,
      modifiedBy: undefined,
    });
  };

  const handlePrint = () => {
    const patient = patients.find((p) => p.patientId === formData.patientId);
    const value = formData.results[parameter.name] || "";
    const [lowStr, highStr] = parameter.normalRange.split("-");
    const low = parseFloat(lowStr);
    const high = parseFloat(highStr);
    const v = parseFloat(value);
    const flag: ReportRow["flag"] = isNaN(v) || isNaN(low) || isNaN(high) ? "" 
      : (v < low ? "LOW" : v > high ? "HIGH" : "NORMAL");

    const rows: ReportRow[] = [
      {
        parameterLabel: parameter.label,
        value,
        unit: parameter.unit,
        normalRange: `${parameter.normalRange} ${parameter.unit}`,
        flag
      }
    ];

    printLabReport({
      reportTitle: "FINAL REPORT",
      testId: formData.testId,
      testType: "Bile Salts",
      patient,
      rows,
      comments: formData.comments,
      minimal: true
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Bile Salts</h1>
        <p className="text-slate-600">Specimen: Blood/Serum. Typical reference: 0.5 - 10 µmol/L</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New Bile Salts Test</CardTitle>
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
                <Select value={formData.patientId} onValueChange={(value) => setFormData((p) => ({ ...p, patientId: value }))} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.patientId} value={p.patientId}>
                        {p.patientId} - {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-2">{parameter.label}</Label>
                <div className="flex">
                  <Input type="number" step={parameter.step} value={formData.results[parameter.name] || ""} onChange={(e) => setFormData((p) => ({ ...p, results: { ...p.results, [parameter.name]: e.target.value } }))} className="flex-1 rounded-r-none" placeholder={parameter.normalRange} />
                  <span className="px-3 py-2 bg-slate-50 border border-l-0 border-slate-300 rounded-r-lg text-sm text-slate-600">{parameter.unit}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Normal: {parameter.normalRange} {parameter.unit}</p>
              </div>
            </div>
            <div>
              <Label className="block text-sm font-medium text-slate-700 mb-2">Comments</Label>
              <Textarea rows={3} value={formData.comments} onChange={(e) => setFormData((p) => ({ ...p, comments: e.target.value }))} />
            </div>
            <div className="flex gap-4">
              <Button type="submit" disabled={createTestMutation.isPending} className="bg-[var(--medical-primary)] hover:bg-[var(--medical-primary-dark)] text-white">{createTestMutation.isPending ? "Saving..." : "Save Results"}</Button>
              <Button type="button" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" /> Print Report</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <EditIdModal isOpen={editingTestId} onClose={() => setEditingTestId(false)} currentId={formData.testId} idType="Test" onUpdate={(newId) => setFormData((p) => ({ ...p, testId: newId }))} />
    </div>
  );
}
