/**
 * Export tools: CSV and PDF download buttons.
 */

import type { ForecastResult } from "../../services/types";

interface ExportToolsProps {
  results: ForecastResult[];
  disease: string;
  jurisdiction: string;
}

function exportCSV(results: ForecastResult[], disease: string, jurisdiction: string) {
  const rows: string[] = [
    "model,week_end,type,point,lower_95,upper_95,lower_80,upper_80,lower_50,upper_50",
  ];

  for (const r of results) {
    // Historical
    for (const obs of r.history) {
      rows.push(
        `${r.model},${obs.week_end},observed,${obs.admissions},,,,,,`
      );
    }
    // Forecasts
    for (const fc of r.forecasts) {
      rows.push(
        `${r.model},${fc.week_end},forecast,${fc.point},${fc.lower_95},${fc.upper_95},${fc.lower_80},${fc.upper_80},${fc.lower_50},${fc.upper_50}`
      );
    }
  }

  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `forecast_${disease}_${jurisdiction}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportPDF(results: ForecastResult[], disease: string, jurisdiction: string) {
  // Dynamic import to keep bundle small when not used
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(
    `Forecast Report: ${disease === "flu" ? "Influenza" : "COVID-19"} — ${jurisdiction}`,
    14,
    20
  );
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  let yOffset = 35;

  for (const r of results) {
    doc.setFontSize(12);
    doc.text(`Model: ${r.model.toUpperCase()}`, 14, yOffset);
    yOffset += 5;

    const tableData = r.forecasts.map((fc) => [
      fc.week_end,
      fc.point.toLocaleString(),
      `[${fc.lower_95.toLocaleString()} – ${fc.upper_95.toLocaleString()}]`,
    ]);

    autoTable(doc, {
      startY: yOffset,
      head: [["Week", "Point", "95% PI"]],
      body: tableData,
      margin: { left: 14 },
      styles: { fontSize: 9 },
    });

    yOffset = ((doc as unknown as Record<string, Record<string, number>>).lastAutoTable?.finalY ?? yOffset) + 10;
  }

  doc.save(
    `forecast_${disease}_${jurisdiction}_${new Date().toISOString().slice(0, 10)}.pdf`
  );
}

export default function ExportTools({
  results,
  disease,
  jurisdiction,
}: ExportToolsProps) {
  return (
    <div className="export-tools">
      <button
        className="export-tools__btn"
        onClick={() => exportCSV(results, disease, jurisdiction)}
        disabled={results.length === 0}
      >
        Export CSV
      </button>
      <button
        className="export-tools__btn"
        onClick={() => exportPDF(results, disease, jurisdiction)}
        disabled={results.length === 0}
      >
        Export PDF
      </button>
    </div>
  );
}
