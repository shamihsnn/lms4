import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, UseQueryOptions } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Printer, 
  FileText, 
  Search, 
  Filter,
  Calendar,
  User,
  TestTube2,
  Eye,
  Trash2
} from "lucide-react";
import { printLabReport, printLabReportsTwoUp, type ReportRow, type PrintOptions } from "@/lib/printReport";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Test, Patient } from "@shared/schema";
import TestReportModal from "../components/modals/test-report-modal";
import { cbcParameters } from "./tests/cbc";
import { lftParameters } from "./tests/lft";
import { rftParameters } from "./tests/rft";
import { lipidParameters } from "./tests/lipid";
import { thyroidParameters } from "./tests/thyroid";
import { testosteroneParameters } from "./tests/testosterone";
import { sugarParameters } from "./tests/sugar";
import { prolactinParameters } from "./tests/prolactin";
import { lhParameters } from "./tests/lh";
import { electrolyteParameters } from "./tests/electrolytes";
import { creatinineParameters } from "./tests/creatinine";
import { bilirubinParameters } from "./tests/bilirubin";
import { cardiacParameters } from "./tests/cardiac";
import { coagulationParameters } from "./tests/coagulation";
import { crpParameters } from "./tests/crp";
import { semenParameters } from "./tests/semen-analysis";
import { urineParameters } from "./tests/urine";
import { raFactorParameters } from "./tests/ra-factor";
import { vdrlParameters } from "./tests/vdrl";
import { typhidotParameters } from "./tests/typhidot";

// Define a shared shape for test parameters
interface TestParameter {
  name: string;
  label: string;
  unit?: string;
}

const testParameterMap: Record<string, readonly TestParameter[]> = {
  CBC: cbcParameters,
  LFT: lftParameters,
  RFT: rftParameters,
  "Lipid Profile": lipidParameters,
  "Thyroid Function": thyroidParameters,
  "Testosterone": testosteroneParameters,
  "Blood Sugar": sugarParameters,
  "Prolactin": prolactinParameters,
  "LH": lhParameters,
  "Electrolytes": electrolyteParameters,
  "Creatinine": creatinineParameters,
  "Bilirubin": bilirubinParameters,
  "Cardiac Markers": cardiacParameters,
  "Coagulation Profile": coagulationParameters,
  "C-Reactive Protein": crpParameters,
  "Semen Analysis": semenParameters,
  "Urine Analysis": urineParameters,
  "Rheumatoid Factor": raFactorParameters,
  "VDRL": vdrlParameters,
  "Typhidot": typhidotParameters,
};

interface TestWithPatient extends Test {
  patient?: Patient;
}

export default function Reports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("all");
  const [selectedTestType, setSelectedTestType] = useState<string>("all");
  const [selectedTest, setSelectedTest] = useState<TestWithPatient | null>(null);
  const [showTestReport, setShowTestReport] = useState(false);
  const [firstAvailableTest, setFirstAvailableTest] = useState<TestWithPatient | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { toast } = useToast();

  // Get all tests with patient information
  const { data: tests = [], isLoading, error } = useQuery<TestWithPatient[]>({
    queryKey: ["/api/tests/with-patients"],
  });

  // Update firstAvailableTest when tests are loaded
  useEffect(() => {
    if (tests && tests.length > 0 && !firstAvailableTest) {
      setFirstAvailableTest(tests[0]);
    }
  }, [tests, firstAvailableTest]);

  // Get all patients for selection
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // Delete test mutation
  const deleteTestMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/tests/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests/with-patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Test report deleted successfully",
        description: "Test report has been removed from the system",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete test report",
        variant: "destructive",
      });
    },
  });

  // Filter tests based on selected patient and test type (defensive against nulls)
  const filteredTests = tests.filter((test: TestWithPatient) => {
    const safeSearch = (value: unknown) =>
      typeof value === "string" ? value.toLowerCase() : "";

    const matchesPatient =
      selectedPatientId === "all" || test.patientId?.toString() === selectedPatientId;
    const matchesTestType =
      selectedTestType === "all" || test.testType === selectedTestType;
    const matchesSearch =
      !searchTerm ||
      safeSearch(test.testId).includes(searchTerm.toLowerCase()) ||
      safeSearch(test.patient?.name).includes(searchTerm.toLowerCase()) ||
      safeSearch(test.patient?.patientId).includes(searchTerm.toLowerCase()) ||
      safeSearch(test.testType).includes(searchTerm.toLowerCase());

    return matchesPatient && matchesTestType && matchesSearch;
  });

  // Group tests by type for the selected patient
  const testsByType: Record<string, TestWithPatient[]> = filteredTests.reduce((acc: Record<string, TestWithPatient[]>, test: TestWithPatient) => {
    const type = test.testType || 'Other';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(test);
    return acc;
  }, {} as Record<string, TestWithPatient[]>);

  // Handle Ctrl+P shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        event.preventDefault(); // Prevent default print dialog
        if (firstAvailableTest) {
          setSelectedTest(firstAvailableTest);
          setShowTestReport(true); // Show the modal
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [firstAvailableTest]);

  // Get unique test types for filter
  const testTypes = Array.from(
    new Set(tests.map((test: TestWithPatient) => test.testType || '').filter(Boolean)),
  ).sort();

  const toggleSelect = (id: number, checked: boolean | string | undefined) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  const allVisibleIds = filteredTests.map(t => t.id as number).filter(Boolean);
  const allChecked = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedIds.has(id));
  const someChecked = allVisibleIds.some(id => selectedIds.has(id)) && !allChecked;

  const toggleSelectAllVisible = (checked: boolean | string | undefined) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) {
        allVisibleIds.forEach(id => next.add(id));
      } else {
        allVisibleIds.forEach(id => next.delete(id));
      }
      return next;
    });
  };

  const buildRowsFromTest = (test: TestWithPatient): ReportRow[] => {
    const params = testParameterMap[test.testType] || [];
    const results = (test.testResults as Record<string, any>) || {};
    const normals = (test.normalRanges as Record<string, any>) || {};
    const flags = (test.flags as Record<string, any>) || {};
    return Object.entries(results).map(([param, value]) => {
      const parameter = params.find(p => p.name === param);
      return {
        parameterLabel: parameter?.label || param.replace(/([A-Z])/g, " $1").trim(),
        value: value as string | number,
        unit: parameter?.unit,
        normalRange: (normals as any)[param] as string | undefined,
        flag: ((flags as any)[param] as ReportRow["flag"]) || "",
      };
    });
  };

  const buildPrintOptions = (test: TestWithPatient): PrintOptions => {
    let referredBy: string | undefined = undefined;
    if (test.patient?.patientId) {
      try { referredBy = localStorage.getItem(`refByDoctor:${test.patient.patientId}`) || undefined; } catch {}
    }
    return {
      reportTitle: "FINAL REPORT",
      testId: test.testId,
      testType: `${test.testType}`,
      patient: test.patient,
      rows: buildRowsFromTest(test),
      minimal: true,
      referredBy,
    };
  };

  const handlePrintSelected = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (ids.length > 2) {
      toast({ title: "Select up to 2 reports", description: "You can print one report or combine two reports on one page.", variant: "destructive" });
      return;
    }
    const selectedTests = tests.filter(t => ids.includes(t.id as number));
    if (selectedTests.length === 1) {
      printLabReport(buildPrintOptions(selectedTests[0] as TestWithPatient));
    } else if (selectedTests.length === 2) {
      const opts = selectedTests.slice(0,2).map(t => buildPrintOptions(t as TestWithPatient));
      printLabReportsTwoUp(opts);
    }
  };

  const handleViewTest = (test: TestWithPatient) => {
    setSelectedTest(test);
    // Get referredBy from localStorage if patient exists
    let referredBy = "";
    if (test.patient?.patientId) {
      try {
        referredBy = localStorage.getItem(`refByDoctor:${test.patient.patientId}`) || "";
      } catch {}
    }
    setShowTestReport(true);
  };

  const handleCloseTestReport = () => {
    setSelectedTest(null);
    setShowTestReport(false);
  };

  const handleDeleteTest = async (testId: number) => {
    try {
      await deleteTestMutation.mutateAsync(testId);
    } catch (error) {
      // Error handling is done in the mutation onError
    }
  };

  const getFlagColor = (flag: string) => {
    switch (flag) {
      case "LOW": return "bg-red-100 text-red-800";
      case "HIGH": return "bg-red-100 text-red-800";
      case "NORMAL": return "bg-green-100 text-green-800";
      case "CRITICAL": return "bg-red-200 text-red-900";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="p-6 space-y-6">


      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Test Reports</h1>
          <p className="text-slate-600 mt-1">View and print individual test reports by patient and test type</p>
        </div>
        <div className="flex items-center gap-2">
          <TestTube2 className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Patient Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Patient</label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                 <SelectContent>
                  <SelectItem value="all">All Patients</SelectItem>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.patientId} - {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Test Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Test Type</label>
              <Select value={selectedTestType} onValueChange={setSelectedTestType}>
                <SelectTrigger>
                  <SelectValue placeholder="All test types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Test Types</SelectItem>
                  {testTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by test ID, patient name, or test type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Total Results */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Total Results</label>
              <div className="text-2xl font-bold text-blue-600">
                {filteredTests.length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-red-500">
              <h3 className="text-lg font-medium text-red-600 mb-2">Error Loading Reports</h3>
              <p className="text-red-500">Failed to load test reports. Please try again.</p>
              <p className="text-sm text-slate-500 mt-2">Error: {error.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection toolbar */}
      <Card>
        <CardContent className="flex items-center justify-between py-4 gap-4">
          <div className="text-sm text-slate-700">
            <strong>{selectedIds.size}</strong> selected
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={selectedIds.size === 0}
              onClick={() => setSelectedIds(new Set())}
            >
              Clear Selection
            </Button>
            <Button
              className="bg-[var(--medical-primary)] hover:bg-[var(--medical-primary-dark)] text-white"
              disabled={selectedIds.size === 0 || selectedIds.size > 2}
              onClick={handlePrintSelected}
            >
              <Printer className="h-4 w-4 mr-2" />
              {selectedIds.size === 2 ? "Print 2-in-1" : "Print Selected"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Reports by Type */}
       {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
       ) : error ? (
         <Card>
           <CardContent className="text-center py-12 text-red-600">
             Failed to load reports
           </CardContent>
         </Card>
       ) : Object.keys(testsByType).length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">No Test Reports Found</h3>
            <p className="text-slate-500">
              {selectedPatientId || searchTerm || selectedTestType !== "all" 
                ? "Try adjusting your search criteria or filters."
                : "No test reports are available in the system."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(testsByType).map(([testType, typeTests]) => (
            <Card key={testType}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TestTube2 className="h-5 w-5 text-blue-600" />
                    {testType} Tests
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {typeTests.length} test(s)
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={allChecked}
                          onCheckedChange={toggleSelectAllVisible}
                          aria-label="Select all visible"
                          className={someChecked ? "data-[state=indeterminate]:opacity-100" : ""}
                        />
                      </TableHead>
                      <TableHead>Test ID</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Test Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Flags</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {typeTests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(test.id as number)}
                            onCheckedChange={(v) => toggleSelect(test.id as number, v)}
                            aria-label={`Select ${test.testId}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {test.testId}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{test.patient?.name || 'N/A'}</div>
                            <div className="text-sm text-slate-500">{test.patient?.patientId || 'N/A'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span className="text-sm">
                              {test.testDate ? new Date(test.testDate).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(test.status || 'completed')}>
                            {test.status || 'completed'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {test.flags && typeof test.flags === 'object' ? (
                              Object.entries(test.flags as Record<string, any>).map(([key, flag]) => (
                                <Badge key={key} className={`text-xs ${getFlagColor(flag as string)}`}>
                                  {flag as string}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-slate-400 text-sm">No flags</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewTest(test)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              View Report
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => printLabReport(buildPrintOptions(test))}
                              className="flex items-center gap-1"
                            >
                              <Printer className="h-3 w-3" />
                              Print
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-200 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Test Report</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete test report <strong>{test.testId}</strong> for patient <strong>{test.patient?.patientId} - {test.patient?.name}</strong>? 
                                    <br /><br />
                                    This action cannot be undone and will permanently remove the test report from the system.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteTest(test.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    disabled={deleteTestMutation.isPending}
                                  >
                                    {deleteTestMutation.isPending ? "Deleting..." : "Delete Report"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Test Report Modal */}
      {selectedTest && (
        <TestReportModal
          isOpen={showTestReport}
          onClose={handleCloseTestReport}
          test={selectedTest}
          parameters={testParameterMap[selectedTest.testType] || []}
          autoPrint={firstAvailableTest === selectedTest} // Only auto-print if this was triggered by Ctrl+P
        />
      )}
    </div>
  );
}
