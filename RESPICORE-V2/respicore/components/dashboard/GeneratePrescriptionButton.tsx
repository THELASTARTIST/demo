// components/dashboard/GeneratePrescriptionButton.tsx
// Professional prescription download button

import { useState } from "react";

export default function GeneratePrescriptionButton() {
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/prescription");
      if (!res.ok) throw new Error("Prescription generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RespiCore_Prescription_${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      // Auto-open new tab for print-to-PDF
      window.open(url, "_blank");
    } catch (e) {
      console.error("Prescription generation failed:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="inline-flex items-center gap-2 text-xs text-emerald-300 hover:text-white border border-emerald-600/40 hover:border-emerald-400/70 bg-emerald-900/20 hover:bg-emerald-900/30 px-3 py-1.5 rounded-lg transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.25)] active:scale-[0.98] disabled:opacity-50"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m5.5 5.5l.5-.5m0 0l.5.5m-.5-.5l-.5-.5m.5-.5v-4m0 0l-.5-.5m.5.5l-.5.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {loading ? "Generating..." : "Generate Prescription"}
    </button>
  );
}
