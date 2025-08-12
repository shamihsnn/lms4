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
import { Edit3, Plus, Printer, Trash } from "lucide-react";
import EditIdModal from "@/components/modals/edit-id-modal";
import { printLabReport, type ReportRow } from "@/lib/printReport";
import type { InsertTest, Patient, TestTemplate } from "@shared/schema";

type Param = {
  name: string;
  label: string;
  unit?: string;
  normalRange: string; // e.g., "4-10", "<5", ">=40", "Negative"
  type: "number" | "text";
  step?: string;
};

export default function CustomBuilder() {
  const [formData, setFormData] = useState({
    testId: "",
    patientId: "",
    testType: "",
    comments: "",
    parameters: [] as Param[],
    results: {} as Record<string, string>,
  });
  const [editingTestId, setEditingTestId] = useState(false);
  const { toast } = useToast();

  const { data: nextIdData } = useQuery<{ nextId: string }>({ queryKey: ["/api/tests/next-id"] });
  const { data: patients = [] } = useQuery<Patient[]>({ queryKey: ["/api/patients"] });
  const { data: templates = [] } = useQuery<TestTemplate[]>({ queryKey: ["/api/test-templates"] });

  const saveTemplateMutation = useMutation({
    mutationFn: async (template: { testType: string; parameters: Param[] }) => {
      const res = await apiRequest("POST", "/api/test-templates", template);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/test-templates"] });
      toast({ title: "Template saved" });
    },
  });

  const createTestMutation = useMutation({
    mutationFn: async (data: InsertTest) => { const res = await apiRequest("POST", "/api/tests", data); return res.json(); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tests/with-patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tests/next-id"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setFormData(prev => ({ ...prev, testId: "", patientId: "", results: {}, comments: "" }));
      toast({ title: "Custom test saved" });
    },
  });

  useEffect(() => {
    if (nextIdData?.nextId && !formData.testId) setFormData(p => ({ ...p, testId: nextIdData.nextId }));
  }, [nextIdData, formData.testId]);

  const addParameter = () => {
    setFormData(p => ({
      ...p,
      parameters: [...p.parameters, { name: `param${p.parameters.length + 1}`, label: "New Parameter", unit: "", normalRange: "", type: "number", step: "0.01" }],
    }));
  };

  const removeParameter = (index: number) => {
    setFormData(p => ({
      ...p,
      parameters: p.parameters.filter((_, i) => i !== index),
    }));
  };

  const updateParameter = (index: number, updates: Partial<Param>) => {
    setFormData(p => ({
      ...p,
      parameters: p.parameters.map((param, i) => (i === index ? { ...param, ...updates } : param)),
    }));
  };

  const handleResultChange = (name: string, value: string) => setFormData(p => ({ ...p, results: { ...p.results, [name]: value } }));

  const deriveFlag = (normalRange: string, type: "number" | "text", value: string): ReportRow["flag"] => {
    if (!value) return "";
    if (type === "text") return value.toLowerCase() === normalRange.toLowerCase() ? "NORMAL" : "ABNORMAL";
    const v = parseFloat(value);
    if (isNaN(v)) return "";
    if (normalRange.includes("-")) {
      const [min, max] = normalRange.split("-").map(parseFloat);
      return v < min ? "LOW" : v > max ? "HIGH" : "NORMAL";
    }
    if (normalRange.startsWith("<")) return v <= parseFloat(normalRange.replace("<", "")) ? "NORMAL" : "HIGH";
    if (normalRange.startsWith(">")) return v >= parseFloat(normalRange.replace(">", "")) ? "NORMAL" : "LOW";
    if (normalRange.startsWith(">=")) return v >= parseFloat(normalRange.replace(">=", "")) ? "NORMAL" : "LOW";
    return "";
  };

  const handleSaveTemplate = async () => {
    if (!formData.testType.trim()) { toast({ title: "Test Type required", variant: "destructive" }); return; }
    if (formData.parameters.length === 0) { toast({ title: "Add at least one parameter", variant: "destructive" }); return; }
    await saveTemplateMutation.mutateAsync({ testType: formData.testType.trim(), parameters: formData.parameters });
  };

  const handleLoadTemplate = (testType: string) => {
    const tpl = templates.find(t => t.testType === testType);
    if (!tpl) return;
    setFormData(p => ({ ...p, testType: tpl.testType, parameters: (tpl.parameters as any as Param[]) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.testId || !formData.patientId || !formData.testType) {
      toast({ title: "Validation Error", description: "Test ID, Patient and Test Type are required", variant: "destructive" });
      return;
    }
    const patient = patients.find(p => p.patientId === formData.patientId);
    if (!patient) { toast({ title: "Patient Not Found", description: "Selected patient not found", variant: "destructive" }); return; }

    const flags: Record<string, string> = {};
    const normalRanges: Record<string, string> = {};
    formData.parameters.forEach(p => {
      const value = formData.results[p.name];
      if (value !== undefined) flags[p.name] = deriveFlag(p.normalRange, p.type, value) || "";
      normalRanges[p.name] = `${p.normalRange}${p.unit ? ` ${p.unit}` : ""}`;
    });

    await createTestMutation.mutateAsync({
      testId: formData.testId,
      patientId: patient.id,
      testType: formData.testType,
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
    const rows: ReportRow[] = formData.parameters.map(p => ({
      parameterLabel: p.label,
      value: formData.results[p.name] || "",
      unit: p.unit,
      normalRange: `${p.normalRange}${p.unit ? ` ${p.unit}` : ""}`,
      flag: deriveFlag(p.normalRange, p.type, formData.results[p.name] || ""),
    }));
    printLabReport({ reportTitle: "FINAL REPORT", testId: formData.testId, testType: formData.testType || "Custom Test", patient, rows, comments: formData.comments, minimal: true });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Custom Test Builder</h1>
        <p className="text-slate-600">Define parameters, units, and normal ranges. Save as template and record results.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Build Test</CardTitle>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-2">Test Type</Label>
                <Input type="text" value={formData.testType} onChange={(e) => setFormData(p => ({ ...p, testType: e.target.value }))} placeholder="e.g., D-Dimer, Ferritin" />
              </div>
              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-2">Load Template</Label>
                <Select value="" onValueChange={handleLoadTemplate}>
                  <SelectTrigger><SelectValue placeholder="Select a saved template" /></SelectTrigger>
                  <SelectContent>
                    {templates.map(t => (<SelectItem key={t.testType} value={t.testType}>{t.testType}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">Parameters</h3>
                <Button type="button" onClick={addParameter} className="bg-[var(--medical-primary)] hover:bg-[var(--medical-primary-dark)]"><Plus className="h-4 w-4 mr-2" /> Add Parameter</Button>
              </div>
              <div className="grid gap-4">
                {formData.parameters.map((param, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                      <Input value={param.label} onChange={(e) => updateParameter(idx, { label: e.target.value })} placeholder="Label" />
                      <Input value={param.name} onChange={(e) => updateParameter(idx, { name: e.target.value })} placeholder="Key (unique)" />
                      <Input value={param.unit || ""} onChange={(e) => updateParameter(idx, { unit: e.target.value })} placeholder="Unit (optional)" />
                      <Select value={param.type} onValueChange={(v: any) => updateParameter(idx, { type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input value={param.normalRange} onChange={(e) => updateParameter(idx, { normalRange: e.target.value })} placeholder="Normal range (e.g., 4-10, <5, >=40, Negative)" />
                      <Button type="button" variant="destructive" onClick={() => removeParameter(idx)}><Trash className="h-4 w-4" /></Button>
                    </div>
                    <div className="mt-3">
                      <Label className="text-sm text-slate-600">Result</Label>
                      <div className="flex mt-1">
                        {param.type === "number" ? (
                          <Input type="number" step={param.step || "0.01"} value={formData.results[param.name] || ""} onChange={(e) => handleResultChange(param.name, e.target.value)} className={param.unit ? "flex-1 rounded-r-none" : "w-full"} />
                        ) : (
                          <Input type="text" value={formData.results[param.name] || ""} onChange={(e) => handleResultChange(param.name, e.target.value)} />
                        )}
                        {param.unit && <span className="px-3 py-2 bg-white border border-l-0 border-slate-300 rounded-r-lg text-sm text-slate-600">{param.unit}</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Normal: {param.normalRange}{param.unit ? ` ${param.unit}` : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="block text-sm font-medium text-slate-700 mb-2">Comments</Label>
              <Textarea rows={3} value={formData.comments} onChange={(e) => setFormData(p => ({ ...p, comments: e.target.value }))} />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={handleSaveTemplate}>Save as Template</Button>
              <Button type="submit" disabled={createTestMutation.isPending} className="bg-[var(--medical-primary)] hover:bg-[var(--medical-primary-dark)] text-white">{createTestMutation.isPending ? "Saving..." : "Save Test Results"}</Button>
              <Button type="button" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" /> Print</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <EditIdModal isOpen={editingTestId} onClose={() => setEditingTestId(false)} currentId={formData.testId} idType="Test" onUpdate={(newId) => setFormData(p => ({ ...p, testId: newId }))} />
    </div>
  );
}


