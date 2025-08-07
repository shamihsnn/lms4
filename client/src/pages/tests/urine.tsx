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
import EditIdModal from "@/components/modals/edit-id-modal";
import type { Patient, InsertTest } from "@shared/schema";

const urineParameters = [
  { name: "color", label: "Color", unit: "", normalRange: "Pale Yellow", step: "", type: "text" },
  { name: "appearance", label: "Appearance", unit: "", normalRange: "Clear", step: "", type: "text" },
  { name: "specificGravity", label: "Specific Gravity", unit: "", normalRange: "1.003-1.030", step: "0.001", type: "number" },
  { name: "ph", label: "pH", unit: "", normalRange: "4.6-8.0", step: "0.1", type: "number" },
  { name: "protein", label: "Protein", unit: "mg/dL", normalRange: "Negative", step: "1", type: "text" },
  { name: "glucose", label: "Glucose", unit: "mg/dL", normalRange: "Negative", step: "1", type: "text" },
  { name: "ketones", label: "Ketones", unit: "", normalRange: "Negative", step: "", type: "text" },
  { name: "blood", label: "Blood", unit: "", normalRange: "Negative", step: "", type: "text" },
  { name: "bilirubin", label: "Bilirubin", unit: "", normalRange: "Negative", step: "", type: "text" },
  { name: "urobilinogen", label: "Urobilinogen", unit: "mg/dL", normalRange: "0.2-1.0", step: "0.1", type: "number" },
  { name: "nitrites", label: "Nitrites", unit: "", normalRange: "Negative", step: "", type: "text" },
  { name: "leukocytes", label: "Leukocytes", unit: "", normalRange: "Negative", step: "", type: "text" },
];

export default function UrineTest() {
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
      queryClient.invalidateQueries({ queryKey: ["/api/tests/next-id"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setFormData({
        testId: "",
        patientId: "",
        results: {},
        comments: "",
      });
      toast({
        title: "Urine analysis saved successfully",
        description: "Urine test results have been recorded",
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
    urineParameters.forEach(param => {
      const value = formData.results[param.name];
      if (value) {
        if (param.type === "number") {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            const [min, max] = param.normalRange.split('-').map(parseFloat);
            if (numValue < min) {
              flags[param.name] = "LOW";
            } else if (numValue > max) {
              flags[param.name] = "HIGH";
            } else {
              flags[param.name] = "NORMAL";
            }
          }
        } else {
          // Text parameters - simple comparison
          flags[param.name] = value.toLowerCase() === param.normalRange.toLowerCase() ? "NORMAL" : "ABNORMAL";
        }
      }
    });

    // Prepare normal ranges
    const normalRanges: Record<string, string> = {};
    urineParameters.forEach(param => {
      normalRanges[param.name] = param.normalRange;
    });

    try {
      await createTestMutation.mutateAsync({
        testId: formData.testId,
        patientId: patient.id,
        testType: "Urine Analysis",
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
    window.print();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Urine Analysis - Complete Urinalysis</h1>
        <p className="text-slate-600">Comprehensive urine examination and analysis</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Urine Analysis</CardTitle>
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

            {/* Urine Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {urineParameters.map((param) => (
                <div key={param.name}>
                  <Label className="block text-sm font-medium text-slate-700 mb-2">
                    {param.label}
                  </Label>
                  <div className="flex">
                    <Input
                      type={param.type}
                      step={param.step || undefined}
                      value={formData.results[param.name] || ""}
                      onChange={(e) => handleResultChange(param.name, e.target.value)}
                      className={param.unit ? "flex-1 rounded-r-none" : "w-full"}
                      placeholder={param.normalRange}
                    />
                    {param.unit && (
                      <span className="px-3 py-2 bg-slate-50 border border-l-0 border-slate-300 rounded-r-lg text-sm text-slate-600">
                        {param.unit}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Normal: {param.normalRange}{param.unit && ` ${param.unit}`}</p>
                </div>
              ))}
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
