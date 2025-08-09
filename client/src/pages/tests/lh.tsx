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

const lhParameters = [
  { name: "male", label: "LH (Male)", unit: "IU/L", normalRange: "1.7-8.6", step: "0.1" },
  { name: "femaleFollicular", label: "LH (Female - Follicular)", unit: "IU/L", normalRange: "2.4-12.6", step: "0.1" },
  { name: "femaleOvulatory", label: "LH (Female - Ovulatory Peak)", unit: "IU/L", normalRange: "14.0-95.6", step: "0.1" },
  { name: "femaleLuteal", label: "LH (Female - Luteal)", unit: "IU/L", normalRange: "1.0-11.4", step: "0.1" },
  { name: "femalePostMenopause", label: "LH (Female - Postmenopausal)", unit: "IU/L", normalRange: "7.7-58.5", step: "0.1" },
];

export default function LHTest() {
  const [formData, setFormData] = useState({
    testId: "",
    patientId: "",
    results: {} as Record<string, string>,
    comments: "",
  });
  const [editingTestId, setEditingTestId] = useState<boolean>(false);

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
      toast({ title: "LH test saved", description: "Luteinizing hormone results recorded" });
    },
  });

  useEffect(() => {
    if (nextIdData?.nextId && !formData.testId) setFormData(prev => ({ ...prev, testId: nextIdData.nextId }));
  }, [nextIdData, formData.testId]);

  const getFlag = (paramName: string, value: string) => {
    const v = parseFloat(value);
    if (isNaN(v) || !value.trim()) return "";
    const p = lhParameters.find(x => x.name === paramName);
    if (!p) return "";
    const [min, max] = p.normalRange.split("-").map(parseFloat);
    if (v < min) return "LOW";
    if (v > max) return "HIGH";
    return "NORMAL";
  };

  const getFlagColor = (flag: string) => {
    switch (flag) {
      case "LOW":
      case "HIGH":
        return "text-red-600 bg-red-50";
      case "NORMAL":
        return "text-green-600 bg-green-50";
      default:
        return "text-slate-500 bg-slate-50";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.testId || !formData.patientId) {
      toast({ title: "Validation Error", description: "Test ID and Patient are required", variant: "destructive" });
      return;
    }
    const patient = patients.find(p => p.patientId === formData.patientId);
    if (!patient) {
      toast({ title: "Patient Not Found", description: "Selected patient not found", variant: "destructive" });
      return;
    }
    const flags: Record<string, string> = {};
    lhParameters.forEach(p => {
      const raw = formData.results[p.name];
      const v = parseFloat(raw);
      if (!isNaN(v)) {
        const [min, max] = p.normalRange.split("-").map(parseFloat);
        flags[p.name] = v < min ? "LOW" : v > max ? "HIGH" : "NORMAL";
      }
    });
    const normalRanges: Record<string, string> = {};
    lhParameters.forEach(p => (normalRanges[p.name] = `${p.normalRange} ${p.unit}`));

    await createTestMutation.mutateAsync({
      testId: formData.testId,
      patientId: patient.id,
      testType: "LH",
      testResults: formData.results,
      normalRanges,
      flags,
      status: "completed",
      performedBy: undefined,
      modifiedBy: undefined,
    });
  };

  const handleResultChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, results: { ...prev.results, [name]: value } }));
  };

  const handleIdUpdate = async (newId: string) => {
    setFormData(prev => ({ ...prev, testId: newId }));
    setEditingTestId(false);
  };

  const handlePrint = () => {
    const patient = patients.find(p => p.patientId === formData.patientId);
    const rows: ReportRow[] = lhParameters.map(p => {
      const value = formData.results[p.name] || "";
      const flag = getFlag(p.name, value) as ReportRow["flag"];
      return {
        parameterLabel: p.label,
        value,
        unit: p.unit,
        normalRange: `${p.normalRange} ${p.unit}`,
        flag,
      };
    });
    printLabReport({ reportTitle: "FINAL REPORT", testId: formData.testId, testType: "Luteinizing Hormone (LH)", patient, rows, comments: formData.comments, minimal: true });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Luteinizing Hormone (LH)</h1>
        <p className="text-slate-600">Phase-specific female ranges and male adult reference included</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New LH Test</CardTitle>
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
                <Select value={formData.patientId} onValueChange={(v) => setFormData(prev => ({ ...prev, patientId: v }))} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(p => (
                      <SelectItem key={p.patientId} value={p.patientId}>{p.patientId} - {p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lhParameters.map(param => (
                <div key={param.name}>
                  <Label className="block text-sm font-medium text-slate-700 mb-2">{param.label}</Label>
                  <div className="flex">
                    <Input type="number" step={param.step} value={formData.results[param.name] || ""} onChange={(e) => handleResultChange(param.name, e.target.value)} className="flex-1 rounded-r-none" placeholder={param.normalRange} />
                    <span className="px-3 py-2 bg-slate-50 border border-l-0 border-slate-300 rounded-r-lg text-sm text-slate-600">{param.unit}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Normal: {param.normalRange} {param.unit}</p>
                </div>
              ))}
            </div>

            <div>
              <Label className="block text-sm font-medium text-slate-700 mb-2">Comments</Label>
              <Textarea rows={3} value={formData.comments} onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))} />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={createTestMutation.isPending} className="bg-[var(--medical-primary)] hover:bg-[var(--medical-primary-dark)] text-white">{createTestMutation.isPending ? "Saving..." : "Save Results"}</Button>
              <Button type="button" variant="outline" onClick={handlePrint} className="text-slate-600 border-slate-300 hover:bg-slate-50"><Printer className="h-4 w-4 mr-2" /> Print Report</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <EditIdModal isOpen={editingTestId} onClose={() => setEditingTestId(false)} currentId={formData.testId} idType="Test" onUpdate={handleIdUpdate} />
    </div>
  );
}


