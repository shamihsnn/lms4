import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Printer, FileText, AlertCircle } from "lucide-react";
import type { Patient, Test } from "@shared/schema";

interface PatientReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
}

interface TestWithPatient extends Test {
  patient?: Patient;
}

export default function PatientReportModal({ isOpen, onClose, patient }: PatientReportModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  // Get tests for the patient
  const { data: tests = [], isLoading } = useQuery<TestWithPatient[]>({
    queryKey: ["/api/patients", patient?.id, "tests"],
    enabled: !!patient?.id && isOpen,
  });

  const handlePrint = () => {
    if (!patient || tests.length === 0) return;

    setIsPrinting(true);
    const printContent = generatePrintContent();
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        setIsPrinting(false);
      }, 250);
    } else {
      setIsPrinting(false);
    }
  };

  const generatePrintContent = () => {
    if (!patient) return '';

    const currentDate = new Date().toLocaleDateString();
    const testsByType = tests.reduce((acc, test) => {
      if (!acc[test.testType]) {
        acc[test.testType] = [];
      }
      acc[test.testType].push(test);
      return acc;
    }, {} as Record<string, TestWithPatient[]>);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient Report - ${patient.patientId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; line-height: 1.4; }
          .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
          .subtitle { font-size: 18px; color: #64748b; }
          .patient-info { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .patient-info h2 { margin: 0 0 15px 0; color: #1e293b; font-size: 20px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .info-item { display: flex; }
          .info-label { font-weight: bold; width: 120px; color: #475569; }
          .info-value { color: #1e293b; }
          .test-section { margin-bottom: 40px; page-break-inside: avoid; }
          .test-header { background: #2563eb; color: white; padding: 15px; border-radius: 8px 8px 0 0; margin: 0; }
          .test-header h3 { margin: 0; font-size: 18px; }
          .test-meta { font-size: 14px; opacity: 0.9; margin-top: 5px; }
          .results-table { width: 100%; border-collapse: collapse; border-radius: 0 0 8px 8px; overflow: hidden; }
          .results-table th { background: #f1f5f9; padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #e2e8f0; }
          .results-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
          .results-table tr:nth-child(even) { background: #f8fafc; }
          .flag-normal { color: #16a34a; font-weight: bold; }
          .flag-high, .flag-low { color: #dc2626; font-weight: bold; }
          .no-tests { text-align: center; padding: 40px; color: #64748b; font-style: italic; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          @media print {
            body { margin: 15px; }
            .test-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Laboratory Management System</div>
          <div class="subtitle">Comprehensive Patient Report</div>
        </div>
        
        <div class="patient-info">
          <h2>Patient Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Patient ID:</span>
              <span class="info-value">${patient.patientId}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Name:</span>
              <span class="info-value">${patient.name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Age:</span>
              <span class="info-value">${patient.age || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Gender:</span>
              <span class="info-value">${patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Phone:</span>
              <span class="info-value">${patient.phone || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Report Date:</span>
              <span class="info-value">${currentDate}</span>
            </div>
          </div>
          ${patient.address ? `
            <div style="margin-top: 15px;">
              <span class="info-label">Address:</span>
              <span class="info-value">${patient.address}</span>
            </div>
          ` : ''}
        </div>

        ${Object.keys(testsByType).length === 0 ? `
          <div class="no-tests">
            <h3>No test results available for this patient</h3>
          </div>
        ` : Object.entries(testsByType).map(([testType, typeTests]) => `
          <div class="test-section">
            <div class="test-header">
              <h3>${testType} Test Results</h3>
              <div class="test-meta">
                ${typeTests.length} test(s) • Latest: ${new Date(typeTests[typeTests.length - 1].createdAt || '').toLocaleDateString()}
              </div>
            </div>
            
            ${typeTests.map(test => `
              <table class="results-table">
                <thead>
                  <tr>
                    <th>Test ID: ${test.testId}</th>
                    <th>Parameter</th>
                    <th>Result</th>
                    <th>Normal Range</th>
                    <th>Flag</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries((test.testResults as Record<string, any>) || {}).map(([param, value]) => {
                    const normalRange = (test.normalRanges as Record<string, any>)?.[param] || 'N/A';
                    const flag = (test.flags as Record<string, any>)?.[param] || '';
                    const flagClass = flag === 'NORMAL' ? 'flag-normal' : flag ? 'flag-high' : '';
                    return `
                      <tr>
                        <td></td>
                        <td style="text-transform: capitalize;">${param.replace(/([A-Z])/g, ' $1').trim()}</td>
                        <td><strong>${value || 'N/A'}</strong></td>
                        <td>${normalRange}</td>
                        <td class="${flagClass}">${flag}</td>
                      </tr>
                    `;
                  }).join('')}
                  ${(test as any).comments ? `
                    <tr>
                      <td></td>
                      <td><strong>Comments:</strong></td>
                      <td colspan="3">${(test as any).comments}</td>
                    </tr>
                  ` : ''}
                </tbody>
              </table>
            `).join('')}
          </div>
        `).join('')}
        
        <div class="footer">
          <p><strong>Laboratory Management System</strong></p>
          <p>Report generated on ${new Date().toLocaleString()}</p>
          <p>This report contains ${tests.length} test result(s) across ${Object.keys(testsByType).length} test type(s)</p>
        </div>
      </body>
      </html>
    `;
  };

  const getFlagColor = (flag: string) => {
    switch (flag) {
      case "LOW": return "text-red-600 bg-red-50";
      case "HIGH": return "text-red-600 bg-red-50";
      case "NORMAL": return "text-green-600 bg-green-50";
      default: return "text-slate-500 bg-slate-50";
    }
  };

  const testsByType = tests.reduce((acc, test) => {
    if (!acc[test.testType]) {
      acc[test.testType] = [];
    }
    acc[test.testType].push(test);
    return acc;
  }, {} as Record<string, TestWithPatient[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Patient Report - {patient?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <span className="font-medium text-slate-600">Patient ID:</span>
                  <p className="font-semibold">{patient?.patientId}</p>
                </div>
                <div>
                  <span className="font-medium text-slate-600">Name:</span>
                  <p className="font-semibold">{patient?.name}</p>
                </div>
                <div>
                  <span className="font-medium text-slate-600">Age:</span>
                  <p className="font-semibold">{patient?.age || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-slate-600">Gender:</span>
                  <p className="font-semibold capitalize">{patient?.gender || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-slate-600">Phone:</span>
                  <p className="font-semibold">{patient?.phone || 'N/A'}</p>
                </div>
              </div>
              {patient?.address && (
                <div className="mt-4">
                  <span className="font-medium text-slate-600">Address:</span>
                  <p className="font-semibold">{patient.address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Results */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : tests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No Test Results</h3>
                <p className="text-slate-500">This patient has no test results on record.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Test Results ({tests.length} total)</h3>
                <Button onClick={handlePrint} disabled={isPrinting} className="bg-[var(--medical-primary)] hover:bg-[var(--medical-primary-dark)]">
                  <Printer className="h-4 w-4 mr-2" />
                  {isPrinting ? "Printing..." : "Print Report"}
                </Button>
              </div>

              {Object.entries(testsByType).map(([testType, typeTests]) => (
                <Card key={testType}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{testType} Tests</span>
                      <span className="text-sm font-normal text-slate-500">
                        {typeTests.length} test(s)
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {typeTests.map((test) => (
                        <div key={test.id} className="border rounded-lg p-4 bg-slate-50">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium">Test ID: {test.testId}</h4>
                            <span className="text-sm text-slate-500">
                              {test.createdAt ? new Date(test.createdAt).toLocaleDateString() : 'No date'}
                            </span>
                          </div>
                          
                          <div className="grid gap-2">
                            {Object.entries((test.testResults as Record<string, any>) || {}).map(([param, value]) => {
                              const normalRange = (test.normalRanges as Record<string, any>)?.[param];
                              const flag = (test.flags as Record<string, any>)?.[param];
                              const flagColor = getFlagColor(flag || '');
                              
                              return (
                                <div key={param} className="flex items-center justify-between py-2 border-b border-slate-200 last:border-b-0">
                                  <div className="flex-1">
                                    <span className="font-medium capitalize">
                                      {param.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                  </div>
                                  <div className="flex-1 text-center">
                                    <span className="font-semibold">{value}</span>
                                  </div>
                                  <div className="flex-1 text-center text-sm text-slate-600">
                                    {normalRange}
                                  </div>
                                  <div className="flex-1 text-center">
                                    {flag && (
                                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${flagColor}`}>
                                        {flag}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {(test as any).comments && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <span className="font-medium text-slate-600">Comments: </span>
                              <span className="text-slate-700">{(test as any).comments}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}