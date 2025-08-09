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

// Reference ranges (adults, typical lab ranges; may vary by method)
const coagParams = [
  { name: "pt", label: "Prothrombin Time (PT)", unit: "sec", normalRange: "11-13.5" },
  { name: "inr", label: "INR", unit: "", normalRange: "0.8-1.1" },
  { name: "aptt", label: "Activated Partial Thromboplastin Time (aPTT)", unit: "sec", normalRange: "30-40" },
  { name: "bleedingTime", label: "Bleeding Time", unit: "min", normalRange: "2-7" },
  { name: "clottingTime", label: "Clotting Time", unit: "min", normalRange: "5-15" },
];

export default function CoagulationTest() {
  const [formData, setFormData] = useState({
    testId: "",
    patientId: "",
    results: {} as Record<string, string>,
    comments: "",
  });
  const [editingTestId, setEditingTestId] = useState(false);
  const { toast } = useToast();

  const { data: nextIdData } = useQuery<{ nextId: string }>({ queryKey: ["/api/tests/next-id"] });
  const { data: patients = [] } = useQuery<Patient[]>({ queryKey: ["/api/patients"] });

  const createTestMutation = useMutation({
    mutationFn: async (data: InsertTest) => {
      const response = await apiRequest("POST", "/api/tests", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tests/with-patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tests/next-id"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setFormData({ testId: "", patientId: "", results: {}, comments: "" });
      toast({ title: "Coagulation profile saved", description: "PT/INR/aPTT recorded" });
    },
  });

  useEffect(() => {
    if (nextIdData?.nextId && !formData.testId) {
      setFormData((prev) => ({ ...prev, testId: nextIdData.nextId }));
    }
  }, [nextIdData, formData.testId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.testId || !formData.patientId) {
      toast({ title: "Validation Error", description: "Test ID and Patient are required", variant: "destructive" });
      return;
    }
    const patient = patients.find((p) => p.patientId === formData.patientId);
    if (!patient) {
      toast({ title: "Patient Not Found", description: "Selected patient not found", variant: "destructive" });
      return;
    }

    const flags: Record<string, string> = {};
    coagParams.forEach((p) => {
      const raw = formData.results[p.name];
      if (raw === undefined || raw === "") return;
      const value = parseFloat(raw);
      if (isNaN(value)) return;
      if (p.normalRange.includes("-")) {
        const [min, max] = p.normalRange.split("-").map(parseFloat);
        flags[p.name] = value < min ? "LOW" : value > max ? "HIGH" : "NORMAL";
      } else {
        flags[p.name] = "";
      }
    });

    const normalRanges: Record<string, string> = {};
    coagParams.forEach((p) => (normalRanges[p.name] = `${p.normalRange} ${p.unit}`.trim()));

    try {
      await createTestMutation.mutateAsync({
        testId: formData.testId,
        patientId: patient.id,
        testType: "Coagulation Profile",
        testResults: formData.results,
        normalRanges,
        flags,
        status: "completed",
        performedBy: undefined,
        modifiedBy: undefined,
      });
    } catch (error: any) {
      toast({ title: "Save Failed", description: error.message || "Failed to save", variant: "destructive" });
    }
  };

  const handleResultChange = (param: string, value: string) => {
    setFormData((prev) => ({ ...prev, results: { ...prev.results, [param]: value } }));
  };

  const handlePrint = () => {
    const patient = patients.find((p) => p.patientId === formData.patientId);
    const rows: ReportRow[] = coagParams.map((p) => ({
      parameterLabel: p.label,
      value: formData.results[p.name] || "",
      unit: p.unit,
      normalRange: `${p.normalRange} ${p.unit}`.trim(),
      flag: (() => {
        const v = parseFloat(formData.results[p.name] || "");
        if (isNaN(v) || !p.normalRange.includes("-")) return "";
        const [min, max] = p.normalRange.split("-").map(parseFloat);
        return v < min ? "LOW" : v > max ? "HIGH" : "NORMAL";
      })(),
    }));
    printLabReport({
      reportTitle: "FINAL REPORT",
      testId: formData.testId,
      testType: "Coagulation Profile",
      patient,
      rows,
      comments: formData.comments,
      minimal: true,
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Coagulation Profile (PT/INR/aPTT)</h1>
        <p className="text-slate-600">Hemostasis assessment including PT, INR, aPTT, bleeding and clotting time</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Coagulation Test</CardTitle>
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
                <Select value={formData.patientId} onValueChange={(value) => setFormData((prev) => ({ ...prev, patientId: value }))} required>
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
              {coagParams.map((param) => (
                <div key={param.name}>
                  <Label className="block text-sm font-medium text-slate-700 mb-2">{param.label}</Label>
                  <div className="flex">
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.results[param.name] || ""}
                      onChange={(e) => handleResultChange(param.name, e.target.value)}
                      className="flex-1 rounded-r-none"
                      placeholder={param.normalRange}
                    />
                    {param.unit && (
                      <span className="px-3 py-2 bg-slate-50 border border-l-0 border-slate-300 rounded-r-lg text-sm text-slate-600">{param.unit}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Normal: {param.normalRange} {param.unit}</p>
                </div>
              ))}
            </div>

            <div>
              <Label className="block text-sm font-medium text-slate-700 mb-2">Comments</Label>
              <Textarea rows={3} value={formData.comments} onChange={(e) => setFormData((prev) => ({ ...prev, comments: e.target.value }))} />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={createTestMutation.isPending} className="bg-[var(--medical-primary)] hover:bg-[var(--medical-primary-dark)] text-white">
                {createTestMutation.isPending ? "Saving..." : "Save Results"}
              </Button>
              <Button type="button" variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" /> Print Report
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <EditIdModal isOpen={editingTestId} onClose={() => setEditingTestId(false)} currentId={formData.testId} idType="Test" onUpdate={(newId) => setFormData((prev) => ({ ...prev, testId: newId }))} />
    </div>
  );
}


