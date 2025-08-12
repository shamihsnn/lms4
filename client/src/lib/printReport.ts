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
  const displayTitle = (reportTitle && reportTitle.toUpperCase() !== "FINAL REPORT") ? reportTitle : testType;

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
        : `${r.value}`;
      return `
        <tr>
          <td>${r.parameterLabel}</td>
          <td class="value ${getFlagClass(r.flag)}">${valueDisplay}</td>
          <td>${r.unit || ""}</td>
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
      <title>${displayTitle} - ${testId}</title>
      <style>
        @page { size: A4; margin: 45mm 16mm 16mm 16mm; }
        body { font-family: Arial, Helvetica, sans-serif; color: #111827; font-size: 14px; margin-top: 48px; }
        .header { display: none; }
        .title { display: none; }
        .meta { display: none; }

        /* Professional header */
        .report-header { display: flex; justify-content: space-between; align-items: end; margin-bottom: 10px; }
        .report-title { font-size: 20px; font-weight: 700; letter-spacing: 0.2px; }
        .report-submeta { font-size: 12px; color: #4b5563; text-align: right; }

        /* Patient information grid */
        .patient-info { margin: 6px 0 12px; }
        .patient-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
        .patient-item { display: flex; gap: 8px; font-size: 13px; }
        .patient-label { font-weight: 600; color: #374151; min-width: 110px; }
        .patient-value { color: #111827; font-weight: 500; }

        .divider { height: 1px; background: #e5e7eb; margin: 8px 0 12px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 8px; font-size: 14px; }
        thead th { background: #f9fafb; text-align: left; font-weight: 700; font-size: 14.5px; }
        .value { font-weight: 600; }
        .flag-normal { color: #16a34a; }
        .flag-high { color: #dc2626; }
        .flag-abnormal { color: #b45309; }
        .footer { display: none; }
        .notes { margin-top: 12px; font-size: 13px; display: ${minimal ? "none" : "block"}; }
      </style>
    </head>
    <body>
      <div class="header"></div>
      <div class="report-header">
        <div class="report-title">${displayTitle}</div>
        <div class="report-submeta">
          <div>Test ID: ${testId}</div>
          <div>Generated: ${generatedAt}</div>
        </div>
      </div>

      <div class="patient-info">
        <div class="patient-grid">
          <div class="patient-item"><span class="patient-label">Patient Name:</span><span class="patient-value">${patient?.name || "N/A"}</span></div>
          <div class="patient-item"><span class="patient-label">Patient ID:</span><span class="patient-value">${patient?.patientId || "N/A"}</span></div>
          <div class="patient-item"><span class="patient-label">Age:</span><span class="patient-value">${(patient?.age as unknown as string) ?? "N/A"} Years</span></div>
          <div class="patient-item"><span class="patient-label">Sex:</span><span class="patient-value">${patient?.gender || "N/A"}</span></div>
          ${referredBy ? `<div class="patient-item"><span class="patient-label">Ref. By:</span><span class="patient-value">${referredBy}</span></div>` : ''}
        </div>
      </div>
      
      <div class="divider"></div>
      <table>
        <thead>
          <tr>
            <th>Tests</th>
            <th>Value</th>
            <th>Unit</th>
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