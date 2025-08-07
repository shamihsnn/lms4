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

const lftParameters = [
  { name: "alt", label: "ALT (SGPT)", unit: "U/L", normalRange: "7-56", step: "1" },
  { name: "ast", label: "AST (SGOT)", unit: "U/L", normalRange: "10-40", step: "1" },
  { name: "alp", label: "Alkaline Phosphatase", unit: "U/L", normalRange: "44-147", step: "1" },
  { name: "totalBilirubin", label: "Total Bilirubin", unit: "mg/dL", normalRange: "0.3-1.2", step: "0.1" },
  { name: "directBilirubin", label: "Direct Bilirubin", unit: "mg/dL", normalRange: "0.0-0.3", step: "0.1" },
  { name: "totalProtein", label: "Total Protein", unit: "g/dL", normalRange: "6.3-8.2", step: "0.1" },
  { name: "albumin", label: "Albumin", unit: "g/dL", normalRange: "3.5-5.0", step: "0.1" },
  { name: "globulin", label: "Globulin", unit: "g/dL", normalRange: "2.3-3.4", step: "0.1" },
];

export default function LFTTest() {
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
        title: "LFT test saved successfully",
        description: "Liver function test results have been recorded",
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
    lftParameters.forEach(param => {
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
    lftParameters.forEach(param => {
      normalRanges[param.name] = param.normalRange;
    });

    try {
      await createTestMutation.mutateAsync({
        testId: formData.testId,
        patientId: patient.id,
        testType: "LFT",
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
    
    const param = lftParameters.find(p => p.name === paramName);
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
    // Create a clean print layout
    const printContent = generatePrintContent();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const generatePrintContent = () => {
    const selectedPatient = patients.find(p => p.patientId === formData.patientId);
    const currentDate = new Date().toLocaleDateString();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>LFT Report - ${formData.testId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
          .report-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .patient-info, .test-info { flex: 1; }
          .results-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .results-table th, .results-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          .results-table th { background-color: #f8f9fa; font-weight: bold; }
          .flag-normal { color: #16a34a; font-weight: bold; }
          .flag-high, .flag-low { color: #dc2626; font-weight: bold; }
          .comments { margin-top: 30px; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Laboratory Management System</div>
          <h2>Liver Function Test (LFT) Report</h2>
        </div>
        
        <div class="report-info">
          <div class="patient-info">
            <h3>Patient Information</h3>
            <p><strong>Patient ID:</strong> ${formData.patientId}</p>
            <p><strong>Name:</strong> ${selectedPatient?.name || 'N/A'}</p>
            <p><strong>Age:</strong> ${selectedPatient?.age || 'N/A'}</p>
            <p><strong>Gender:</strong> ${selectedPatient?.gender || 'N/A'}</p>
          </div>
          <div class="test-info">
            <h3>Test Information</h3>
            <p><strong>Test ID:</strong> ${formData.testId}</p>
            <p><strong>Test Type:</strong> LFT</p>
            <p><strong>Date:</strong> ${currentDate}</p>
            <p><strong>Status:</strong> Completed</p>
          </div>
        </div>
        
        <table class="results-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Result</th>
              <th>Normal Range</th>
              <th>Flag</th>
            </tr>
          </thead>
          <tbody>
            ${lftParameters.map(param => {
              const value = formData.results[param.name] || '';
              const flag = getFlag(param.name, value);
              const flagClass = flag === 'NORMAL' ? 'flag-normal' : flag ? 'flag-high' : '';
              return `
                <tr>
                  <td>${param.label}</td>
                  <td>${value} ${value ? param.unit : ''}</td>
                  <td>${param.normalRange} ${param.unit}</td>
                  <td class="${flagClass}">${flag}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        ${formData.comments ? `
          <div class="comments">
            <h3>Comments</h3>
            <p>${formData.comments}</p>
          </div>
        ` : ''}
        
        <div class="footer">
          <p>This report was generated by Laboratory Management System</p>
          <p>Report generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">LFT Test - Liver Function Test</h1>
        <p className="text-slate-600">Comprehensive liver function analysis</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New LFT Test</CardTitle>
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

            {/* LFT Parameters */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">Test Parameters</h3>
              <div className="grid gap-4">
                {lftParameters.map((param) => {
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
