import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { InsertTest, Patient } from "@shared/schema";
import { Printer } from "lucide-react";
import { printLabReport, type ReportRow } from "@/lib/printReport";

const aboGroups = ["A", "B", "AB", "O"] as const;
const rhOptions = ["Positive", "Negative"] as const;

export default function BloodGroupTest() {
  const [formData, setFormData] = useState({ testId: "", patientId: "", abo: "", rh: "" });
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
      setFormData({ testId: "", patientId: "", abo: "", rh: "" });
      toast({ title: "Blood group saved" });
    },
  });

  useEffect(() => {
    if (nextIdData?.nextId && !formData.testId) setFormData((p) => ({ ...p, testId: nextIdData.nextId }));
  }, [nextIdData, formData.testId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.testId || !formData.patientId || !formData.abo || !formData.rh) {
      toast({ title: "Validation Error", description: "Test ID, Patient, ABO, and Rh are required", variant: "destructive" });
      return;
    }
    const patient = patients.find((p) => p.patientId === formData.patientId);
    if (!patient) {
      toast({ title: "Patient Not Found", description: "Selected patient not found", variant: "destructive" });
      return;
    }
    await createTestMutation.mutateAsync({
      testId: formData.testId,
      patientId: patient.id,
      testType: "Blood Group",
      testResults: { ABO: formData.abo, RH: formData.rh },
      normalRanges: { ABO: "N/A", RH: "N/A" },
      flags: { ABO: "", RH: "" },
      status: "completed",
      performedBy: undefined,
      modifiedBy: undefined,
    });
  };

  const handlePrint = () => {
    const patient = patients.find((p) => p.patientId === formData.patientId);
    const rows: ReportRow[] = [
      { parameterLabel: "ABO", value: formData.abo, normalRange: "", flag: "" },
      { parameterLabel: "RH", value: formData.rh, normalRange: "", flag: "" },
    ];
    printLabReport({ reportTitle: "FINAL REPORT", testId: formData.testId, testType: "Blood Group", patient, rows, minimal: true });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Blood Grouping</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New Blood Group Test</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-2">Test ID</Label>
                <Input type="text" value={formData.testId} readOnly className="bg-slate-50 text-slate-600" />
              </div>
              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-2">Patient</Label>
                <Select value={formData.patientId} onValueChange={(v) => setFormData((p) => ({ ...p, patientId: v }))} required>
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
                <Label className="block text-sm font-medium text-slate-700 mb-2">ABO</Label>
                <Select value={formData.abo} onValueChange={(v) => setFormData((p) => ({ ...p, abo: v }))} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ABO" />
                  </SelectTrigger>
                  <SelectContent>
                    {aboGroups.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-2">RH</Label>
                <Select value={formData.rh} onValueChange={(v) => setFormData((p) => ({ ...p, rh: v }))} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select RH" />
                  </SelectTrigger>
                  <SelectContent>
                    {rhOptions.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-4">
              <Button type="submit" disabled={createTestMutation.isPending} className="bg-[var(--medical-primary)] hover:bg-[var(--medical-primary-dark)] text-white">{createTestMutation.isPending ? "Saving..." : "Save Result"}</Button>
              <Button type="button" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" /> Print Report</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


