import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Printer, FileText, AlertCircle, Calendar, User, TestTube2 } from "lucide-react";
import { printLabReport, type ReportRow } from "@/lib/printReport";
import type { Test, Patient } from "@shared/schema";

interface TestWithPatient extends Test {
  patient?: Patient;
}

interface TestParameter {
  name: string;
  label: string;
  unit?: string;
}

interface TestReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: TestWithPatient | null;
  parameters: readonly TestParameter[];
  referredBy?: string;
  autoPrint?: boolean;
}

export default function TestReportModal({ isOpen, onClose, test, parameters = [], referredBy, autoPrint = false }: TestReportModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [hasPrintAttempted, setHasPrintAttempted] = useState(false);

  // Effect for auto-printing
  useEffect(() => {
    if (autoPrint && test && !hasPrintAttempted) {
      handlePrint();
      setHasPrintAttempted(true);
    }
  }, [autoPrint, test, hasPrintAttempted]);

  const handlePrint = () => {
    if (!test) return;
    setIsPrinting(true);
    try {
      const rows: ReportRow[] = Object.entries((test.testResults as Record<string, any>) || {}).map(
        ([param, value]) => {
          const normalRange = (test.normalRanges as Record<string, any>)?.[param];
          const flag = (test.flags as Record<string, any>)?.[param] as ReportRow["flag"] | undefined;
          const parameter = parameters.find(p => p.name === param);
          return {
            parameterLabel: parameter?.label || param.replace(/([A-Z])/g, " $1").trim(),
            value: value as string | number,
            unit: parameter?.unit,
            normalRange: normalRange as string | undefined,
            flag: flag || "",
          };
        },
      );

      // Get referredBy either from props or try to get from localStorage
      let doctorName = referredBy;
      if (!doctorName && test.patient?.patientId) {
        try {
          doctorName = localStorage.getItem(`refByDoctor:${test.patient.patientId}`) || undefined;
        } catch {}
      }

      printLabReport({
        reportTitle: "FINAL REPORT",
        testId: test.testId,
        testType: `${test.testType}`,
        patient: test.patient,
        rows,
        minimal: true,
        referredBy: doctorName,
      });
    } finally {
      setTimeout(() => setIsPrinting(false), 300);
    }
  };

  const generatePrintContent = () => ""; // legacy template removed; using printLabReport instead

  const getFlagColor = (flag: string) => {
    switch (flag) {
      case "LOW": return "text-red-600 bg-red-50";
      case "HIGH": return "text-red-600 bg-red-50";
      case "NORMAL": return "text-green-600 bg-green-50";
      case "CRITICAL": return "text-red-700 bg-red-100";
      default: return "text-slate-500 bg-slate-50";
    }
  };

  if (!test) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {test.testType} Report - {test.testId}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube2 className="h-5 w-5" />
                Report Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="font-medium text-slate-600">Test ID:</span>
                  <p className="font-semibold">{test.testId}</p>
                </div>
                <div>
                  <span className="font-medium text-slate-600">Test Type:</span>
                  <p className="font-semibold">{test.testType}</p>
                </div>
                <div>
                  <span className="font-medium text-slate-600">Test Date:</span>
                  <p className="font-semibold">
                    {test.testDate ? new Date(test.testDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-slate-600">Status:</span>
                  <Badge className="mt-1">
                    {test.status || 'completed'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patient Information */}
          {test.patient && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <span className="font-medium text-slate-600">Patient ID:</span>
                    <p className="font-semibold">{test.patient.patientId}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Name:</span>
                    <p className="font-semibold">{test.patient.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Age:</span>
                    <p className="font-semibold">{test.patient.age || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Gender:</span>
                    <p className="font-semibold capitalize">{test.patient.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Phone:</span>
                    <p className="font-semibold">{test.patient.phone || 'N/A'}</p>
                  </div>
                </div>
                {test.patient.address && (
                  <div className="mt-4">
                    <span className="font-medium text-slate-600">Address:</span>
                    <p className="font-semibold">{test.patient.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TestTube2 className="h-5 w-5" />
                  Test Results
                </span>
                <Button onClick={handlePrint} disabled={isPrinting} className="bg-[var(--medical-primary)] hover:bg-[var(--medical-primary-dark)]">
                  <Printer className="h-4 w-4 mr-2" />
                  {isPrinting ? "Printing..." : "Print Report"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries((test.testResults as Record<string, any>) || {}).map(([param, value]) => {
                  const normalRange = (test.normalRanges as Record<string, any>)?.[param];
                  const flag = (test.flags as Record<string, any>)?.[param];
                  const flagColor = getFlagColor(flag || '');
                  
                  return (
                    <div key={param} className="flex items-center justify-between py-3 border-b border-slate-200 last:border-b-0">
                      <div className="flex-1">
                        <span className="font-medium capitalize">
                          {param.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                      <div className="flex-1 text-center">
                        <span className="font-semibold text-lg">{value || 'N/A'}</span>
                      </div>
                      <div className="flex-1 text-center text-sm text-slate-600">
                        {normalRange || 'N/A'}
                      </div>
                      <div className="flex-1 text-center">
                        {flag && (
                          <Badge className={`${flagColor} text-xs`}>
                            {flag}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
