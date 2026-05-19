"use client";

import { AdminTripRow } from "@/types/api";

export function CsvExportButton({ rows }: { rows: AdminTripRow[] }) {
  function handleExport() {
    const headers = [
      "Trip ID",
      "Traveler",
      "Route",
      "Trip status",
      "Booking status",
      "Recommended carrier",
      "Recommended cost",
      "Projected savings",
      "Policy compliant",
      "Flags",
    ];
    const csvRows = [
      headers,
      ...rows.map((row) => [
        row.trip_id,
        row.traveler_name,
        row.route,
        row.trip_status,
        row.booking_status ?? "",
        row.recommended_carrier,
        row.recommended_cost,
        row.projected_savings,
        row.policy_compliant ? "Yes" : "No",
        row.flags.join("; "),
      ]),
    ];
    const csv = csvRows.map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mentat-travel-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button className="btn-secondary" type="button" onClick={handleExport}>
      Export CSV
    </button>
  );
}

function csvCell(value: string | number): string {
  const text = String(value);
  if (!/[",\n]/.test(text)) {
    return text;
  }
  return `"${text.replaceAll('"', '""')}"`;
}
