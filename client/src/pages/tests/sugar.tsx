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
import { Edit3, Printer, Check, X } from "lucide-react";
import { printLabReport, type ReportRow } from "@/lib/printReport";
import EditIdModal from "@/components/modals/edit-id-modal";
import type { Patient, InsertTest } from "@shared/schema";
import { useEditableRanges } from "@/hooks/use-editable-ranges";
import { EditableParameterRow } from "@/components/ui/editable-parameter-row";

export const sugarParameters = [
  { name: "fastingGlucose", label: "Fasting Glucose", unit: "mg/dL", normalRange: "70-100", step: "1" },
  { name: "randomGlucose", label: "Random Glucose", unit: "mg/dL", normalRange: "70-140", step: "1" },
  { name: "postPrandial", label: "Post Prandial (2hr)", unit: "mg/dL", normalRange: "<140", step: "1" },
  { name: "hba1c", label: "HbA1c", unit: "%", normalRange: "4.0-5.6", step: "0.1" },
  { name: "gtt1hr", label: "GTT 1 Hour", unit: "mg/dL", normalRange: "<180", step: "1" },
  { name: "gtt2hr", label: "GTT 2 Hour", unit: "mg/dL", normalRange: "<140", step: "1" },
];

export default function SugarTest() {
  const [formData, setFormData] = useState({
    testId: "",
    patientId: "",
    results: {} as Record<string, string>,
    comments: "",
  });
  const [editingTestId, setEditingTestId] = useState<boolean>(false);

  // Use editable ranges hook
  const {
    rangeOverrides,
    setRangeOverrides,
    flagOverrides,
    setFlagOverrides,
    editingRange,
    setEditingRange,
    editingFlag,
    setEditingFlag,
    getFlag,
    getFlagColor,
    calculateFlags,
    getNormalRanges,
  } = useEditableRanges(sugarParameters);

  const { toast } = useToast();

  // Get next test ID
  const { data: nextIdData } = useQuery<{ nextId: string }>({
    queryKey: ["/api/tests/next-id"],
  });

  // Get all patients
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // Create test mutation
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
      setFormData({
        testId: "",
        patientId: "",
        results: {},
        comments: "",
      });
      toast({
        title: "Blood sugar test saved successfully",
        description: "Glucose test results have been recorded",
      });
    },
  });

  // Set initial test ID when component loads
  useEffect(() => {
    if (nextIdData?.nextId && !formData.testId) {
      setFormData(prev => ({ ...prev, testId: nextIdData.nextId }));
    }
  }, [nextIdData, formData.testId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.testId || !formData.patientId) {
      toast({
        title: "Validation Error",
        description: "Test ID and Patient are required",
        variant: "destructive",
      });
      return;
    }

    // Find patient by patientId
    const patient = patients.find(p => p.patientId === formData.patientId);
    if (!patient) {
      toast({
        title: "Patient Not Found",
        description: "Selected patient not found",
        variant: "destructive",
      });
      return;
    }

    // Calculate flags based on results (using editable ranges)
    const flags = calculateFlags(formData.results);
    const normalRanges = getNormalRanges();

    try {
      await createTestMutation.mutateAsync({
        testId: formData.testId,
        patientId: patient.id,
        testType: "Blood Sugar",
        testResults: formData.results,
        normalRanges,
        flags,
        status: "completed",
        performedBy: undefined,
        modifiedBy: undefined,
      });
    } catch (error: any) {
      toast({
        title: "Test Save Failed",
        description: error.message || "Failed to save test results",
        variant: "destructive",
      });
    }
  };

  const handleResultChange = (paramName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      results: { ...prev.results, [paramName]: value }
    }));
  };

  const handleIdUpdate = async (newId: string) => {
    setFormData(prev => ({ ...prev, testId: newId }));
    setEditingTestId(false);
  };

  const handlePrint = () => {
    const selectedPatient = patients.find(p => p.patientId === formData.patientId);
    const rows: ReportRow[] = sugarParameters.map(param => {
      const value = formData.results[param.name] || "";
      // derive flag similar to calculation above
      let flag: ReportRow["flag"] = "";
      if (value !== "") {
        const v = parseFloat(value);
        if (param.name === "postPrandial" || param.name === "gtt1hr" || param.name === "gtt2hr") {
          const thr = parseFloat(param.normalRange.replace('<', ''));
          flag = !isNaN(v) ? (v <= thr ? "NORMAL" : "HIGH") : "";
        } else if (param.name === "hba1c") {
          const [min, max] = param.normalRange.split('-').map(parseFloat);
          flag = !isNaN(v) ? (v < min ? "LOW" : v > max ? "HIGH" : "NORMAL") : "";
        } else {
          const [min, max] = param.normalRange.split('-').map(parseFloat);
          flag = !isNaN(v) ? (v < min ? "LOW" : v > max ? "HIGH" : "NORMAL") : "";
        }
      }
      return {
        parameterLabel: param.label,
        value,
        unit: param.unit,
        normalRange: `${(rangeOverrides[param.name] ?? param.normalRange)} ${param.unit}`,
        flag,
      };
    });
    printLabReport({
      reportTitle: "FINAL REPORT",
      testId: formData.testId,
      testType: "Blood Sugar",
      patient: selectedPatient,
      rows,
      comments: formData.comments,
      minimal: true,
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Blood Sugar Test - Glucose Analysis</h1>
        <p className="text-slate-600">Comprehensive glucose level testing and diabetes screening</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Blood Sugar Test</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Test ID and Patient Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-2">Test ID</Label>
                <div className="flex">
                  <Input
                    type="text"
                    value={formData.testId}
                    readOnly
                    className="flex-1 rounded-r-none bg-slate-50 text-slate-600"
                  />
                  <Button
                    type="button"
                    className="rounded-l-none bg-[var(--medical-primary)] hover:bg-[var(--medical-primary-dark)]"
                    onClick={() => setEditingTestId(true)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-2">Patient</Label>
                <Select 
                  value={formData.patientId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, patientId: value }))}
                  required
                >
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

            {/* Sugar Parameters */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">Test Parameters</h3>
              <div className="grid gap-4">
                {sugarParameters.map((param) => {
                  const currentValue = formData.results[param.name] || "";
                  const flag = getFlag(param.name, currentValue);
                  const flagColor = getFlagColor(flag);
                  const currentRange = rangeOverrides[param.name] ?? param.normalRange;
                  const isEditingRange = !!editingRange[param.name];
                  const isEditingFlag = !!editingFlag[param.name];
                  
                  return (
                    <EditableParameterRow
                      key={param.name}
                      param={param}
                      currentValue={currentValue}
                      onResultChange={handleResultChange}
                      currentRange={currentRange}
                      isEditingRange={isEditingRange}
                      onRangeEdit={(paramName) => setEditingRange(prev => ({ ...prev, [paramName]: true }))}
                      onRangeChange={(paramName, range) => setRangeOverrides(prev => ({ ...prev, [paramName]: range }))}
                      onRangeSave={(paramName) => setEditingRange(prev => ({ ...prev, [paramName]: false }))}
                      onRangeCancel={(paramName) => {
                        setRangeOverrides(prev => ({ ...prev, [paramName]: param.normalRange }));
                        setEditingRange(prev => ({ ...prev, [paramName]: false }));
                      }}
                      flag={flag}
                      flagColor={flagColor}
                      isEditingFlag={isEditingFlag}
                      onFlagEdit={(paramName) => setEditingFlag(prev => ({ ...prev, [paramName]: true }))}
                      onFlagChange={(paramName, flagValue) => setFlagOverrides(prev => ({ ...prev, [paramName]: flagValue }))}
                      onFlagSave={(paramName) => setEditingFlag(prev => ({ ...prev, [paramName]: false }))}
                      onFlagCancel={(paramName) => {
                        setFlagOverrides(prev => {
                          const clone = { ...prev };
                          delete clone[paramName];
                          return clone;
                        });
                        setEditingFlag(prev => ({ ...prev, [paramName]: false }));
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Comments */}
            <div>
              <Label className="block text-sm font-medium text-slate-700 mb-2">Comments</Label>
              <Textarea
                value={formData.comments}
                onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                rows={3}
                placeholder="Additional observations or notes..."
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <Button
                type="submit"
                disabled={createTestMutation.isPending}
                className="bg-[var(--medical-primary)] hover:bg-[var(--medical-primary-dark)] text-white"
              >
                {createTestMutation.isPending ? "Saving..." : "Save Test Results"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handlePrint}
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <EditIdModal
        isOpen={editingTestId}
        onClose={() => setEditingTestId(false)}
        currentId={formData.testId}
        idType="Test"
        onUpdate={handleIdUpdate}
      />
    </div>
  );
}
