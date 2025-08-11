import type { Patient } from "@shared/schema";

export type ReportRow = {
  parameterLabel: string;
  value: string | number;
  unit?: string;
  normalRange?: string;
  flag?: "LOW" | "HIGH" | "NORMAL" | "CRITICAL" | "ABNORMAL" | "";
};

export function printLabReport(options: {
  reportTitle: string;
  testId: string;
  testType: string;
  patient: Patient | undefined;
  rows: ReportRow[];
  comments?: string;
  logoUrl?: string;
  referredBy?: string | null;
  minimal?: boolean;
}): void {
  const {
    reportTitle,
    testId,
    testType,
    patient,
    rows,
    comments,
    logoUrl = "/logo-al-qasim.jpg",
    referredBy = null,
    minimal = false,
  } = options;

  const now = new Date();
  const generatedAt = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

  const getFlagClass = (flag?: string) => {
    switch (flag) {
      case "LOW":
      case "HIGH":
      case "CRITICAL":
        return "flag-high";
      case "NORMAL":
        return "flag-normal";
      case "ABNORMAL":
        return "flag-abnormal";
      default:
        return "";
    }
  };

  const tableRows = rows
    .map((r) => {
      const valueDisplay = r.value === undefined || r.value === null || r.value === ""
        ? ""
        : `${r.value}${r.unit ? ` ${r.unit}` : ""}`;
      return `
        <tr>
          <td>${r.parameterLabel}</td>
          <td class="value ${getFlagClass(r.flag)}">${valueDisplay}</td>
          <td>${r.normalRange || ""}</td>
          <td class="flag ${getFlagClass(r.flag)}">${r.flag || ""}</td>
        </tr>
      `;
    })
    .join("");

  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${reportTitle} - ${testId}</title>
      <style>
        @page { size: A4; margin: 45mm 16mm 16mm 16mm; }
        body { font-family: Arial, Helvetica, sans-serif; color: #111827; font-size: 13px; }
        .header { display: none; }
        .title { display: none; }
        .meta { display: none; }
        
        .patient-info {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 12px 16px;
          margin: 10px 0 14px;
          border-radius: 4px;
        }
        .patient-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 12.5px;
        }
        .patient-row:last-child {
          margin-bottom: 0;
        }
        .patient-label {
          font-weight: 600;
          color: #374151;
          min-width: 100px;
        }
        .patient-value {
          color: #111827;
          font-weight: 500;
        }
        .patient-divider {
          border-bottom: 1px dotted #cbd5e1;
          margin: 8px 0;
        }
        
        .divider { height: 1px; background: #e5e7eb; margin: 10px 0 14px; }
        .final-banner { display: none; }
        .brand { display: ${minimal ? "none" : "flex"}; }
        .info { display: ${minimal ? "none" : "grid"}; }
        .section-title { display: ${minimal ? "none" : "block"}; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 8px; font-size: 13px; }
        thead th { background: #f9fafb; text-align: left; font-weight: 700; font-size: 13.5px; }
        .value { font-weight: 600; }
        .flag-normal { color: #16a34a; }
        .flag-high { color: #dc2626; }
        .flag-abnormal { color: #b45309; }
        .footer { display: none; }
        .notes { margin-top: 12px; font-size: 12px; display: ${minimal ? "none" : "block"}; }
      </style>
    </head>
    <body>
      <div class="header"></div>
      
      <div class="patient-info">
        <div class="patient-row">
          <span class="patient-label">Report:</span>
          <span class="patient-value">${generatedAt} ${reportTitle} - ${testId}</span>
        </div>
        <div class="patient-divider"></div>
        <div class="patient-row">
          <span class="patient-label">Patient Name:</span>
          <span class="patient-value">${patient?.name || "N/A"}</span>
        </div>
        <div class="patient-row">
          <span class="patient-label">Patient ID:</span>
          <span class="patient-value">${patient?.patientId || "N/A"}</span>
        </div>
        <div class="patient-divider"></div>
        <div class="patient-row">
          <span class="patient-label">Age:</span>
          <span class="patient-value">${(patient?.age as unknown as string) ?? "N/A"} Years</span>
        </div>
        <div class="patient-row">
          <span class="patient-label">Sex:</span>
          <span class="patient-value">${patient?.gender || "N/A"}</span>
        </div>
        ${referredBy ? `
        <div class="patient-divider"></div>
        <div class="patient-row">
          <span class="patient-label">Ref. By:</span>
          <span class="patient-value">${referredBy}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="divider"></div>
      <table>
        <thead>
          <tr>
            <th>Tests</th>
            <th>Value</th>
            <th>Normal Value</th>
            <th>Flag</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      ${comments && !minimal ? `<div class="notes"><strong>Comments:</strong> ${comments}</div>` : ""}
    </body>
  </html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
}