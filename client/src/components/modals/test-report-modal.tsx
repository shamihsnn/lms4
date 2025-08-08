import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Printer, FileText, AlertCircle, Calendar, User, TestTube2 } from "lucide-react";
import type { Test, Patient } from "@shared/schema";

interface TestWithPatient extends Test {
  patient?: Patient;
}

interface TestReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: TestWithPatient | null;
}

export default function TestReportModal({ isOpen, onClose, test }: TestReportModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    if (!test) return;

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
    if (!test || !test.patient) return '';

    const currentDate = new Date().toLocaleDateString();
    const testDate = test.testDate ? new Date(test.testDate).toLocaleDateString() : 'N/A';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${test.testType} Report - ${test.testId}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333; 
            line-height: 1.4; 
            background: white;
          }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #2563eb; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
          }
          .logo { 
            font-size: 28px; 
            font-weight: bold; 
            color: #2563eb; 
            margin-bottom: 10px; 
          }
          .subtitle { 
            font-size: 18px; 
            color: #64748b; 
          }
          .report-info { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 30px; 
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px; 
          }
          .info-item { 
            display: flex; 
          }
          .info-label { 
            font-weight: bold; 
            width: 120px; 
            color: #475569; 
          }
          .info-value { 
            color: #1e293b; 
          }
          .test-results { 
            margin-bottom: 40px; 
          }
          .test-header { 
            background: #2563eb; 
            color: white; 
            padding: 15px; 
            border-radius: 8px 8px 0 0; 
            margin: 0; 
          }
          .test-header h3 { 
            margin: 0; 
            font-size: 18px; 
          }
          .results-table { 
            width: 100%; 
            border-collapse: collapse; 
            border-radius: 0 0 8px 8px; 
            overflow: hidden; 
          }
          .results-table th { 
            background: #f1f5f9; 
            padding: 12px; 
            text-align: left; 
            font-weight: bold; 
            border-bottom: 2px solid #e2e8f0; 
          }
          .results-table td { 
            padding: 12px; 
            border-bottom: 1px solid #e2e8f0; 
          }
          .results-table tr:nth-child(even) { 
            background: #f8fafc; 
          }
          .flag-normal { 
            color: #16a34a; 
            font-weight: bold; 
          }
          .flag-high, .flag-low, .flag-critical { 
            color: #dc2626; 
            font-weight: bold; 
          }
          .footer { 
            margin-top: 50px; 
            text-align: center; 
            font-size: 12px; 
            color: #64748b; 
            border-top: 1px solid #e2e8f0; 
            padding-top: 20px; 
          }
          @media print {
            body { margin: 15px; }
            .test-results { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Laboratory Management System</div>
          <div class="subtitle">${test.testType} Test Report</div>
        </div>
        
        <div class="report-info">
          <h2>Report Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Test ID:</span>
              <span class="info-value">${test.testId}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Test Type:</span>
              <span class="info-value">${test.testType}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Test Date:</span>
              <span class="info-value">${testDate}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Report Date:</span>
              <span class="info-value">${currentDate}</span>
            </div>
          </div>
        </div>

        <div class="report-info">
          <h2>Patient Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Patient ID:</span>
              <span class="info-value">${test.patient.patientId}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Name:</span>
              <span class="info-value">${test.patient.name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Age:</span>
              <span class="info-value">${test.patient.age || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Gender:</span>
              <span class="info-value">${test.patient.gender ? test.patient.gender.charAt(0).toUpperCase() + test.patient.gender.slice(1) : 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Phone:</span>
              <span class="info-value">${test.patient.phone || 'N/A'}</span>
            </div>
          </div>
          ${test.patient.address ? `
            <div style="margin-top: 15px;">
              <span class="info-label">Address:</span>
              <span class="info-value">${test.patient.address}</span>
            </div>
          ` : ''}
        </div>

        <div class="test-results">
          <div class="test-header">
            <h3>${test.testType} Test Results</h3>
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
              ${Object.entries((test.testResults as Record<string, any>) || {}).map(([param, value]) => {
                const normalRange = (test.normalRanges as Record<string, any>)?.[param] || 'N/A';
                const flag = (test.flags as Record<string, any>)?.[param] || '';
                const flagClass = flag === 'NORMAL' ? 'flag-normal' : flag ? 'flag-high' : '';
                return `
                  <tr>
                    <td style="text-transform: capitalize; font-weight: 500;">${param.replace(/([A-Z])/g, ' $1').trim()}</td>
                    <td><strong>${value || 'N/A'}</strong></td>
                    <td>${normalRange}</td>
                    <td class="${flagClass}">${flag}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p><strong>Laboratory Management System</strong></p>
          <p>Report generated on ${new Date().toLocaleString()}</p>
          <p>This is an official laboratory test report</p>
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
