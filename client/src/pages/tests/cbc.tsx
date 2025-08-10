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

const cbcParameters = [
  { name: "wbc", label: "WBC Count", unit: "×10³/μL", normalRange: "4.5-11.0", step: "0.01" },
  { name: "rbc", label: "RBC Count", unit: "×10⁶/μL", normalRange: "4.2-5.4", step: "0.01" },
  { name: "hemoglobin", label: "Hemoglobin", unit: "g/dL", normalRange: "13.5-17.5", step: "0.1" },
  { name: "hematocrit", label: "Hematocrit", unit: "%", normalRange: "38.8-50.0", step: "0.1" },
  { name: "platelets", label: "Platelets", unit: "×10³/μL", normalRange: "150-450", step: "1" },
  { name: "mcv", label: "MCV", unit: "fL", normalRange: "82-98", step: "0.1" },
  // Additional parameters from the haematology report
  { name: "neutrophils", label: "Neutrophils", unit: "%", normalRange: "45-70", step: "0.1" },
  { name: "lymphocytes", label: "Lymphocytes", unit: "%", normalRange: "20-40", step: "0.1" },
  { name: "monocytes", label: "Monocytes", unit: "%", normalRange: "2-7", step: "0.1" },
  { name: "eosinophils", label: "Eosinophils", unit: "%", normalRange: "1-4", step: "0.1" },
  { name: "hct", label: "HCT", unit: "%", normalRange: "40-54", step: "0.1" },
  { name: "mch", label: "MCH", unit: "pg", normalRange: "27-32", step: "0.1" },
  { name: "mchc", label: "MCHC", unit: "%", normalRange: "31-35", step: "0.1" },
];

export default function CBCTest() {
  const [formData, setFormData] = useState({
    testId: "",
    patientId: "",
    results: {} as Record<string, string>,
    comments: "",
  });
  const [editingTestId, setEditingTestId] = useState<boolean>(false);

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
        title: "CBC test saved successfully",
        description: "Test results have been recorded",
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

    // Calculate flags based on results
    const flags: Record<string, string> = {};
    cbcParameters.forEach(param => {
      const value = parseFloat(formData.results[param.name]);
      if (!isNaN(value)) {
        const [min, max] = param.normalRange.split('-').map(parseFloat);
        if (value < min) {
          flags[param.name] = "LOW";
        } else if (value > max) {
          flags[param.name] = "HIGH";
        } else {
          flags[param.name] = "NORMAL";
        }
      }
    });

    // Prepare normal ranges
    const normalRanges: Record<string, string> = {};
    cbcParameters.forEach(param => {
      normalRanges[param.name] = param.normalRange;
    });

    try {
      await createTestMutation.mutateAsync({
        testId: formData.testId,
        patientId: patient.id,
        testType: "CBC",
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

  // Function to get flag for a parameter
  const getFlag = (paramName: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || !value.trim()) return "";
    
    const param = cbcParameters.find(p => p.name === paramName);
    if (!param) return "";
    
    const [min, max] = param.normalRange.split('-').map(parseFloat);
    if (numValue < min) return "LOW";
    if (numValue > max) return "HIGH";
    return "NORMAL";
  };

  // Function to get flag color
  const getFlagColor = (flag: string) => {
    switch (flag) {
      case "LOW": return "text-red-600 bg-red-50";
      case "HIGH": return "text-red-600 bg-red-50";
      case "NORMAL": return "text-green-600 bg-green-50";
      default: return "text-slate-500 bg-slate-50";
    }
  };

  const handleIdUpdate = async (newId: string) => {
    setFormData(prev => ({ ...prev, testId: newId }));
    setEditingTestId(false);
  };

  const handlePrint = () => {
    const selectedPatient = patients.find(p => p.patientId === formData.patientId);
    const rows: ReportRow[] = cbcParameters.map(param => {
      const value = formData.results[param.name] || "";
      const flag = getFlag(param.name, value) as ReportRow["flag"];
      return {
        parameterLabel: param.label,
        value,
        unit: param.unit,
        normalRange: `${param.normalRange} ${param.unit}`,
        flag,
      };
    });
    printLabReport({
      reportTitle: "FINAL REPORT",
      testId: formData.testId,
      testType: "Complete Blood Count (CBC)",
      patient: selectedPatient,
      rows,
      comments: formData.comments,
      minimal: true,
    });
  };

  // Group parameters for better organization
  const basicParameters = cbcParameters.slice(0, 6);
  const differentialParameters = cbcParameters.filter(p => 
    ['neutrophils', 'lymphocytes', 'monocytes', 'eosinophils'].includes(p.name)
  );
  const additionalParameters = cbcParameters.filter(p => 
    ['hct', 'mch', 'mchc'].includes(p.name)
  );

  const renderParameterGroup = (parameters: typeof cbcParameters, title: string) => (
    <div className="space-y-4">
      <h4 className="text-md font-semibold text-slate-700 border-l-4 border-blue-500 pl-3">
        {title}
      </h4>
      <div className="grid gap-4">
        {parameters.map((param) => {
          const currentValue = formData.results[param.name] || "";
          const flag = getFlag(param.name, currentValue);
          const flagColor = getFlagColor(flag);
          
          return (
            <div key={param.name} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
                {/* Parameter Name */}
                <div className="lg:col-span-1">
                  <Label className="text-sm font-medium text-slate-700">
                    {param.label}
                  </Label>
                </div>
                
                {/* Normal Range */}
                <div className="lg:col-span-1">
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">Normal Range:</span>
                    <div className="text-blue-600 font-semibold">
                      {param.normalRange} {param.unit}
                    </div>
                  </div>
                </div>
                
                {/* Result Input */}
                <div className="lg:col-span-1">
                  <div className="flex">
                    <Input
                      type="number"
                      step={param.step}
                      value={currentValue}
                      onChange={(e) => handleResultChange(param.name, e.target.value)}
                      className="flex-1 rounded-r-none text-center font-medium"
                      placeholder="Enter result"
                    />
                    <span className="px-3 py-2 bg-white border border-l-0 border-slate-300 rounded-r-lg text-sm text-slate-600 font-medium">
                      {param.unit}
                    </span>
                  </div>
                </div>
                
                {/* Flag Status */}
                <div className="lg:col-span-1">
                  {flag && (
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${flagColor}`}>
                      {flag}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">CBC Test - Complete Blood Count</h1>
        <p className="text-slate-600">Comprehensive blood analysis and cell count</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New CBC Test</CardTitle>
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

            {/* CBC Parameters - Organized in groups */}
            <div className="space-y-8">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">Test Parameters</h3>
              
              {renderParameterGroup(basicParameters, "Basic Parameters")}
              {renderParameterGroup(differentialParameters, "Differential Count")}
              {renderParameterGroup(additionalParameters, "Additional Indices")}
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