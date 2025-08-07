import { useState } from "react";
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

const cardiacParameters = [
  { name: "troponinI", label: "Troponin I", unit: "ng/mL", normalRange: "<0.04", step: "0.001" },
  { name: "troponinT", label: "Troponin T", unit: "ng/mL", normalRange: "<0.01", step: "0.001" },
  { name: "ckMb", label: "CK-MB", unit: "ng/mL", normalRange: "<6.3", step: "0.1" },
  { name: "myoglobin", label: "Myoglobin", unit: "ng/mL", normalRange: "25-72", step: "1" },
  { name: "ldh", label: "LDH", unit: "U/L", normalRange: "140-280", step: "1" },
  { name: "bnp", label: "BNP", unit: "pg/mL", normalRange: "<100", step: "1" },
  { name: "ntProBnp", label: "NT-proBNP", unit: "pg/mL", normalRange: "<125", step: "1" },
  { name: "dDimer", label: "D-Dimer", unit: "mg/L", normalRange: "<0.50", step: "0.01" },
];

export default function CardiacTest() {
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
        title: "Cardiac markers test saved successfully",
        description: "Cardiac test results have been recorded",
      });
    },
  });

  // Set initial test ID when component loads
  React.useEffect(() => {
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
    cardiacParameters.forEach(param => {
      const value = parseFloat(formData.results[param.name]);
      if (!isNaN(value)) {
        if (param.normalRange.includes('<')) {
          // Upper limit only
          const threshold = parseFloat(param.normalRange.replace('<', ''));
          flags[param.name] = value <= threshold ? "NORMAL" : "HIGH";
        } else if (param.normalRange.includes('>')) {
          // Lower limit only
          const threshold = parseFloat(param.normalRange.replace('>', ''));
          flags[param.name] = value >= threshold ? "NORMAL" : "LOW";
        } else {
          // Range-based
          const [min, max] = param.normalRange.split('-').map(parseFloat);
          if (value < min) {
            flags[param.name] = "LOW";
          } else if (value > max) {
            flags[param.name] = "HIGH";
          } else {
            flags[param.name] = "NORMAL";
          }
        }
      }
    });

    // Prepare normal ranges
    const normalRanges: Record<string, string> = {};
    cardiacParameters.forEach(param => {
      normalRanges[param.name] = param.normalRange;
    });

    try {
      await createTestMutation.mutateAsync({
        testId: formData.testId,
        patientId: patient.id,
        testType: "Cardiac Markers",
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
        <h1 className="text-2xl font-bold text-slate-800">Cardiac Markers - Heart Function Analysis</h1>
        <p className="text-slate-600">Comprehensive cardiac enzyme and biomarker testing</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Cardiac Markers Test</CardTitle>
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

            {/* Cardiac Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cardiacParameters.map((param) => (
                <div key={param.name}>
                  <Label className="block text-sm font-medium text-slate-700 mb-2">
                    {param.label}
                  </Label>
                  <div className="flex">
                    <Input
                      type="number"
                      step={param.step}
                      value={formData.results[param.name] || ""}
                      onChange={(e) => handleResultChange(param.name, e.target.value)}
                      className="flex-1 rounded-r-none"
                      placeholder={param.normalRange}
                    />
                    <span className="px-3 py-2 bg-slate-50 border border-l-0 border-slate-300 rounded-r-lg text-sm text-slate-600">
                      {param.unit}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Normal: {param.normalRange} {param.unit}</p>
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
