import type { Patient } from "@shared/schema";

export type ReportRow = {
  parameterLabel: string;
  value: string | number;
  unit?: string;
  normalRange?: string;
  flag?: "LOW" | "HIGH" | "NORMAL" | "CRITICAL" | "ABNORMAL" | "";
};

export type PrintOptions = {
  reportTitle: string;
  testId: string;
  testType: string;
  patient: Patient | undefined;
  rows: ReportRow[];
  comments?: string;
  logoUrl?: string;
  referredBy?: string | null;
  minimal?: boolean;
};

function getFlagClass(flag?: string): string {
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
}

export function printLabReport(options: PrintOptions): void {
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

  const tableRows = rows
    .map((r: ReportRow) => {
      const valueDisplay = r.value === undefined || r.value === null || r.value === ""
        ? ""
        : `${r.value}`;
      const unitDisplay = (r.unit && r.unit.trim()) ? r.unit : inferUnitFromRange(r.normalRange);
      return `
        <tr>
          <td>${r.parameterLabel}</td>
          <td class="value ${getFlagClass(r.flag)}">${valueDisplay}</td>
          <td>${unitDisplay || ""}</td>
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
        @page { size: A4; margin: 0; }
        body { font-family: Arial, Helvetica, sans-serif; color: #111827; font-size: 16px; margin: 50mm 16mm 16mm 16mm; }
        .header { display: none; }
        .title { display: none; }
        .meta { display: none; }

        /* Professional header */
        .report-header { display: flex; justify-content: space-between; align-items: end; margin-bottom: 10px; }
        .report-title { font-size: 24px; font-weight: 700; letter-spacing: 0.2px; }
        .report-submeta { font-size: 14px; color: #4b5563; text-align: right; }

        /* Patient information grid */
        .patient-info { margin: 6px 0 12px; }
        .patient-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
        .patient-item { display: flex; gap: 8px; font-size: 15px; }
        .patient-label { font-weight: 600; color: #374151; min-width: 110px; }
        .patient-value { color: #111827; font-weight: 500; }

        .divider { height: 1px; background: #e5e7eb; margin: 8px 0 12px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 8px; font-size: 16px; }
        thead th { background: #f9fafb; text-align: left; font-weight: 700; font-size: 16.5px; }
        .value { font-weight: 600; }
        .flag-normal { color: #16a34a; }
        .flag-high { color: #dc2626; }
        .flag-abnormal { color: #b45309; }
        .footer { display: none; }
        .notes { margin-top: 12px; font-size: 15px; display: ${minimal ? "none" : "block"}; }
      </style>
    </head>
    <body>
      ${renderSingleReportSection({
        displayTitle,
        testId,
        generatedAt,
        patient,
        referredBy,
        tableRows,
        comments,
        minimal,
      })}
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
};

// Try to infer unit from the normal range text if unit is missing.
// Examples:
//  - "0.7-1.3 mg/dL" => "mg/dL"
//  - "<10 U/mL" => "U/mL"
//  - "Negative" => "" (no unit)
const inferUnitFromRange = (range?: string): string => {
  if (!range) return "";
  const trimmed = range.trim();
  const match = trimmed.match(/([A-Za-z%µμ]+(?:\/[A-Za-z]+){0,2})\s*$/);
  if (!match) return "";
  const token = match[1];
  if (/^(Negative|Positive|Normal|normal|NEGATIVE|POSITIVE)$/i.test(trimmed)) return "";
  if (!/[A-Za-zµμ]/.test(token)) return "";
  return token;
};

// Render a single report section (used by both single and two-up)
// Added `showPatientInfo` flag to control whether patient details are printed.
function renderSingleReportSection(args: {
  displayTitle: string;
  testId: string;
  generatedAt: string;
  patient: Patient | undefined;
  referredBy: string | null;
  tableRows: string;
  comments?: string;
  minimal?: boolean;
  showPatientInfo?: boolean; // NEW - default true
}): string {
  const { displayTitle, testId, generatedAt, patient, referredBy, tableRows, comments, minimal, showPatientInfo = true } = args;

  // Compact header used when patient info is suppressed (two-up second report)
  const compactHeader = `
    <div class="report-header">
      <div class="report-title">${displayTitle}</div>
      <div class="report-submeta">
        <div>Test ID: ${testId}</div>
        <div>Generated: ${generatedAt}</div>
      </div>
    </div>
  `;

  // Full patient info block (existing markup)
  const patientInfoBlock = `
      <div class="patient-info">
        <div class="patient-grid">
          <div class="patient-item"><span class="patient-label">Patient Name:</span><span class="patient-value">${patient?.name || "N/A"}</span></div>
          <div class="patient-item"><span class="patient-label">Patient ID:</span><span class="patient-value">${patient?.patientId || "N/A"}</span></div>
          <div class="patient-item"><span class="patient-label">Age:</span><span class="patient-value">${(patient?.age as unknown as string) ?? "N/A"} Years</span></div>
          <div class="patient-item"><span class="patient-label">Sex:</span><span class="patient-value">${patient?.gender || "N/A"}</span></div>
          ${referredBy ? `<div class="patient-item"><span class="patient-label">Ref. By:</span><span class="patient-value">${referredBy}</span></div>` : ''}
        </div>
      </div>
  `;

  return `
      <div class="header"></div>
      ${compactHeader}
      ${showPatientInfo ? patientInfoBlock : ''}
      
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
  `;
}

// Two-up printing: print up to two reports on one page (same top margin)
export function printLabReportsTwoUp(reports: PrintOptions[]): void {
  const items = reports.slice(0, 2);
  if (items.length === 0) return;

  const sections = items.map((opt, idx) => {
    const now = new Date();
    const generatedAt = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    const displayTitle = (opt.reportTitle && opt.reportTitle.toUpperCase() !== "FINAL REPORT") ? opt.reportTitle : opt.testType;

    const tableRows = opt.rows.map((r: ReportRow) => {
      const valueDisplay = r.value === undefined || r.value === null || r.value === "" ? "" : `${r.value}`;
      const unitDisplay = (r.unit && r.unit.trim()) ? r.unit : inferUnitFromRange(r.normalRange);
      return `
        <tr>
          <td>${r.parameterLabel}</td>
          <td class="value ${getFlagClass(r.flag)}">${valueDisplay}</td>
          <td>${unitDisplay || ""}</td>
          <td>${r.normalRange || ""}</td>
          <td class="flag ${getFlagClass(r.flag)}">${r.flag || ""}</td>
        </tr>`;
    }).join("");

    // For two-up printing: show patient info only for the first section (idx === 0).
    return renderSingleReportSection({
      displayTitle,
      testId: opt.testId,
      generatedAt,
      patient: opt.patient,
      referredBy: opt.referredBy ?? null,
      tableRows,
      comments: opt.comments,
      minimal: opt.minimal,
      showPatientInfo: idx === 0, // NEW - only first section gets patient block
    });
  }).join('<div style="height:19mm"></div>');

  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${items.map(i => i.testId).join(' & ')} - Two Up</title>
      <style>
        @page { size: A4; margin: 0; }
        body { font-family: Arial, Helvetica, sans-serif; color: #111827; font-size: 16px; margin: 50mm 16mm 16mm 16mm; }
        .header { display: none; }
        .title { display: none; }
        .meta { display: none; }
        .report-header { display: flex; justify-content: space-between; align-items: end; margin-bottom: 10px; }
        .report-title { font-size: 22px; font-weight: 700; letter-spacing: 0.2px; }
        .report-submeta { font-size: 13px; color: #4b5563; text-align: right; }
        .patient-info { margin: 6px 0 10px; }
        .patient-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
        .patient-item { display: flex; gap: 8px; font-size: 14px; }
        .patient-label { font-weight: 600; color: #374151; min-width: 110px; }
        .patient-value { color: #111827; font-weight: 500; }
        .divider { height: 1px; background: #e5e7eb; margin: 6px 0 10px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border-bottom: 1px solid #e5e7eb; padding: 8px 6px; font-size: 15px; }
        thead th { background: #f9fafb; text-align: left; font-weight: 700; font-size: 15.5px; }
        .value { font-weight: 600; }
        .flag-normal { color: #16a34a; }
        .flag-high { color: #dc2626; }
        .flag-abnormal { color: #b45309; }
        .footer { display: none; }
        .notes { margin-top: 10px; font-size: 14px; }
      </style>
    </head>
    <body>
      ${sections}
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

// Queue-based two-up helper
const TWO_UP_KEY = "labdesk_two_up_queue_v1";

export function queueTwoUpReport(item: PrintOptions): void {
  try {
    const raw = localStorage.getItem(TWO_UP_KEY);
    const arr: PrintOptions[] = raw ? JSON.parse(raw) : [];
    const next = [...arr, item].slice(0, 2);
    localStorage.setItem(TWO_UP_KEY, JSON.stringify(next));
    if (next.length < 2) {
      window.alert("Added to 2-in-1 print queue (1/2). Add one more report and use the same button to print both together.");
    } else {
      printLabReportsTwoUp(next);
      localStorage.removeItem(TWO_UP_KEY);
    }
  } catch {
    printLabReport(item);
  }
}

export function clearTwoUpQueue(): void {
  localStorage.removeItem(TWO_UP_KEY);
}