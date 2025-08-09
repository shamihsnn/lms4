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

const malariaParams = [
  { name: "pfAg", label: "P. falciparum Antigen", unit: "", normalRange: "Negative", type: "text" as const },
  { name: "pvAg", label: "P. vivax Antigen", unit: "", normalRange: "Negative", type: "text" as const },
  { name: "panAg", label: "Pan Plasmodium Antigen", unit: "", normalRange: "Negative", type: "text" as const },
];

export default function ICTMalariaTest() {
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
      toast({ title: "ICT Malaria test saved", description: "Rapid malaria antigen results recorded" });
    },
  });

  useEffect(() => {
    if (nextIdData?.nextId && !formData.testId) {
      setFormData(prev => ({ ...prev, testId: nextIdData.nextId }));
    }
  }, [nextIdData, formData.testId]);

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
    malariaParams.forEach(param => {
      const value = formData.results[param.name];
      if (value && param.type === "text") {
        flags[param.name] = value.toLowerCase() === param.normalRange.toLowerCase() ? "NORMAL" : "ABNORMAL";
      }
    });
    const normalRanges: Record<string, string> = {};
    malariaParams.forEach(p => (normalRanges[p.name] = p.normalRange));

    await createTestMutation.mutateAsync({
      testId: formData.testId,
      patientId: patient.id,
      testType: "ICT Malaria",
      testResults: formData.results,
      normalRanges,
      flags,
      status: "completed",
      performedBy: undefined,
      modifiedBy: undefined,
    });
  };

  const handleResultChange = (paramName: string, value: string) => {
    setFormData(prev => ({ ...prev, results: { ...prev.results, [paramName]: value } }));
  };

  const handleIdUpdate = async (newId: string) => {
    setFormData(prev => ({ ...prev, testId: newId }));
    setEditingTestId(false);
  };

  const handlePrint = () => {
    const selectedPatient = patients.find(p => p.patientId === formData.patientId);
    const rows: ReportRow[] = malariaParams.map(param => {
      const value = formData.results[param.name] || "";
      let flag: ReportRow["flag"] = "";
      if (value !== "") {
        flag = value.toLowerCase() === param.normalRange.toLowerCase() ? "NORMAL" : "ABNORMAL";
      }
      return {
        parameterLabel: param.label,
        value,
        normalRange: param.normalRange,
        flag,
      };
    });
    printLabReport({
      reportTitle: "FINAL REPORT",
      testId: formData.testId,
      testType: "ICT Malaria",
      patient: selectedPatient,
      rows,
      comments: formData.comments,
      minimal: true,
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">ICT Malaria Rapid Antigen Test</h1>
        <p className="text-slate-600">Detection of Plasmodium antigens (Pf, Pv, Pan)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New ICT Malaria Test</CardTitle>
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
                <Select value={formData.patientId} onValueChange={(value) => setFormData(prev => ({ ...prev, patientId: value }))} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.patientId} value={patient.patientId}>
                        {patient.patientId} - {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {malariaParams.map((param) => (
                <div key={param.name}>
                  <Label className="block text-sm font-medium text-slate-700 mb-2">{param.label}</Label>
                  <Input
                    type="text"
                    value={formData.results[param.name] || ""}
                    onChange={(e) => handleResultChange(param.name, e.target.value)}
                    placeholder={param.normalRange}
                  />
                  <p className="text-xs text-slate-500 mt-1">Normal: {param.normalRange}</p>
                </div>
              ))}
            </div>

            <div>
              <Label className="block text-sm font-medium text-slate-700 mb-2">Comments</Label>
              <Textarea rows={3} value={formData.comments} onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))} />
            </div>

            <div className="flex space-x-4">
              <Button type="submit" disabled={createTestMutation.isPending} className="bg-[var(--medical-primary)] hover:bg-[var(--medical-primary-dark)] text-white">
                {createTestMutation.isPending ? "Saving..." : "Save Test Results"}
              </Button>
              <Button type="button" variant="outline" onClick={handlePrint} className="text-slate-600 border-slate-300 hover:bg-slate-50">
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <EditIdModal isOpen={editingTestId} onClose={() => setEditingTestId(false)} currentId={formData.testId} idType="Test" onUpdate={handleIdUpdate} />
    </div>
  );
}


