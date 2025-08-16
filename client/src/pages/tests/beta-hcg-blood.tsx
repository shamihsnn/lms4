import { useEffect, useMemo, useState } from "react";
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

// Beta hCG pregnancy week reference ranges (mIU/mL)
const weekRanges: Record<string, string> = {
  "3": "5-72",
  "4": "10-708",
  "5": "217-8245",
  "6": "152-32177",
  "7": "4059-153767",
  "8": "31366-149094",
  "9": "59109-135901",
  "10": "44186-170409",
  "12": "27107-201165",
  "14": "24302-93646",
  "15": "12540-69747",
  "16": "8904-55332",
  "17": "8240-51793",
  "18": "9649-55271",
};

const nonPregnantFemaleNormal = "<5"; // mIU/mL
const healthyMaleFemale = "<2"; // mIU/mL (general healthy)

// Helpers to format numbers and ranges for a professional look
const formatNumber = (n: number) => n.toLocaleString();
const formatRange = (r: string) => {
  const [lo, hi] = r.split("-");
  const low = parseFloat(lo);
  const high = parseFloat(hi);
  if (isNaN(low) || isNaN(high)) return r;
  return `${formatNumber(low)}-${formatNumber(high)}`;
};

export default function BetaHCGBloodTest() {
  const [formData, setFormData] = useState({
    testId: "",
    patientId: "",
    week: "",
    value: "",
    comments: "",
  });
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
      setFormData({ testId: "", patientId: "", week: "", value: "", comments: "" });
      toast({ title: "Blood beta hCG test saved" });
    }
  });

  useEffect(() => { if (nextIdData?.nextId && !formData.testId) setFormData(p => ({ ...p, testId: nextIdData.nextId })); }, [nextIdData, formData.testId]);

  const currentRange = useMemo(() => {
    if (!formData.week) return `Non-pregnant: ${nonPregnantFemaleNormal} mIU/mL`;
    const wr = weekRanges[formData.week];
    return wr ? `${formatRange(wr)} mIU/mL` : `Non-pregnant: ${nonPregnantFemaleNormal} mIU/mL`;
  }, [formData.week]);

  const calcFlag = (num: number | null): ReportRow["flag"] => {
    if (num == null || isNaN(num)) return "";
    if (!formData.week) {
      // no week selected: compare to non-pregnant
      const thr = parseFloat(nonPregnantFemaleNormal.replace("<", ""));
      return num < thr ? "NORMAL" : "HIGH";
    }
    const wr = weekRanges[formData.week];
    if (!wr) return "";
    const [lowStr, highStr] = wr.split("-");
    const low = parseFloat(lowStr); const high = parseFloat(highStr);
    if (isNaN(low) || isNaN(high)) return "";
    if (num < low) return "LOW";
    if (num > high) return "HIGH";
    return "NORMAL";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.testId || !formData.patientId) { toast({ title: "Validation Error", description: "Test ID and Patient are required", variant: "destructive" }); return; }
    const patient = patients.find(p => p.patientId === formData.patientId);
    if (!patient) { toast({ title: "Patient Not Found", description: "Selected patient not found", variant: "destructive" }); return; }

    const num = formData.value ? parseFloat(formData.value) : NaN;
    const flags: Record<string, string> = {};
    const flag = calcFlag(isNaN(num) ? null : num);
    if (flag) flags.value = flag;

    const normalRanges: Record<string, string> = {
      value: currentRange,
      week: formData.week || "N/A",
      notes: `Healthy male/female reference: ${healthyMaleFemale} mIU/mL`,
    } as any;

    await createTestMutation.mutateAsync({
      testId: formData.testId,
      patientId: patient.id,
      testType: "Beta hCG (Serum, Quantitative)",
      testResults: { value: formData.value, week: formData.week },
      normalRanges,
      flags,
      status: "completed",
      performedBy: undefined,
      modifiedBy: undefined,
    });
  };

  const handlePrint = () => {
    const patient = patients.find(p => p.patientId === formData.patientId);
    const vStr = formData.value || "";
    const v = vStr ? parseFloat(vStr) : NaN;
    const flag = calcFlag(isNaN(v) ? null : v);
    const selWeek = formData.week || "";
    const weekLabel = selWeek ? `${selWeek} weeks` : "N/A";
    const weekRangeDisplay = selWeek && weekRanges[selWeek]
      ? `${formatRange(weekRanges[selWeek])} mIU/mL`
      : `${nonPregnantFemaleNormal} mIU/mL`;
    const rows: ReportRow[] = [
      { parameterLabel: "Beta hCG (Serum)", value: vStr, unit: "mIU/mL", normalRange: weekRangeDisplay, flag },
      { parameterLabel: "Gestational Age", value: weekLabel, normalRange: "", flag: "" },
      { parameterLabel: "Reference (by selected week)", value: "", unit: "", normalRange: weekRangeDisplay, flag: "" },
      { parameterLabel: "Non-pregnant Reference", value: "", unit: "", normalRange: `${nonPregnantFemaleNormal} mIU/mL`, flag: "" },
      { parameterLabel: "General Healthy (Male/Female)", value: "", unit: "", normalRange: `${healthyMaleFemale} mIU/mL`, flag: "" },
    ];
    printLabReport({ reportTitle: "FINAL REPORT", testId: formData.testId, testType: "Beta hCG (Serum, Quantitative)", patient, rows, comments: formData.comments, minimal: true });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Beta hCG (Blood, Quantitative)</h1>
        <p className="text-slate-600">Select pregnancy week to auto-apply reference ranges</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New Beta hCG (Serum) Test</CardTitle>
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
                <Label className="block text-sm font-medium text-slate-700 mb-2">Pregnancy Week</Label>
                <Select value={formData.week} onValueChange={(v) => setFormData(p => ({ ...p, week: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select week (optional)" /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(weekRanges).map(w => (<SelectItem key={w} value={w}>{w} weeks</SelectItem>))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">Leave empty to compare with non-pregnant reference</p>
              </div>

              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-2">Result</Label>
                <div className="flex">
                  <Input type="number" step="1" value={formData.value} onChange={(e) => setFormData(p => ({ ...p, value: e.target.value }))} className="flex-1 rounded-r-none" placeholder="e.g., 1200" />
                  <span className="px-3 py-2 bg-slate-50 border border-l-0 border-slate-300 rounded-r-lg text-sm text-slate-600">mIU/mL</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Reference: {currentRange}</p>
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
