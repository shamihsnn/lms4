import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Test, Patient } from "@shared/schema";
import TestReportModal from "../components/modals/test-report-modal";

interface TestWithPatient extends Test {
  patient?: Patient;
}

export default function Reports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("all");
  const [selectedTestType, setSelectedTestType] = useState<string>("all");
  const [selectedTest, setSelectedTest] = useState<TestWithPatient | null>(null);
  const [showTestReport, setShowTestReport] = useState(false);

  const { toast } = useToast();

  // Get all tests with patient information
  const { data: tests = [], isLoading, error } = useQuery<TestWithPatient[]>({
    queryKey: ["/api/tests/with-patients"],
  });

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
  const filteredTests = (tests || []).filter((test) => {
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
  const testsByType = filteredTests.reduce((acc, test) => {
    if (!acc[test.testType]) {
      acc[test.testType] = [];
    }
    acc[test.testType].push(test);
    return acc;
  }, {} as Record<string, TestWithPatient[]>);

  // Get unique test types for filter
  const testTypes = Array.from(
    new Set((tests || []).map((test) => test.testType).filter(Boolean)),
  ).sort();

  const handleViewTest = (test: TestWithPatient) => {
    setSelectedTest(test);
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
        />
      )}
    </div>
  );
}
