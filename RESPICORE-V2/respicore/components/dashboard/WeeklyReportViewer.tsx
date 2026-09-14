"use client";

import { useState } from "react";

interface WeeklyReportData {
  generated_at: string;
  period: { start: string; end: string };
  sleep_disruption: {
    latest_week: any;
    weekly_trend: any[];
  };
  inhaler_efficiency: {
    total_puffs_week: number;
    total_puffs_last_week: number;
    days_with_usage_week: number;
    trend: string;
    gina_flag: boolean;
    daily_breakdown: { date: string; puffs: number }[];
  } | null;
  baseline: any;
  alerts: Array<{ id: string; severity: string; message: string; detail: string }>;
  voice_biomarkers: {
    total_recordings: number;
    avg_cough_count: number | null;
    avg_hoarseness_index: number | null;
    avg_breathing_duration: number | null;
  };
  medication_summary: {
    total_entries: number;
    rescue_inhaler_count: number;
    maintenance_count: number;
    other_count: number;
  };
  triage_distribution: { normal: number; anomalous: number; wheeze: number; copd: number };
  total_readings: number;
  clinical_summary: string;
  impact_metrics?: any;
}

interface WeeklyReportViewerProps {
  report: WeeklyReportData;
  onClose: () => void;
}

export default function WeeklyReportViewer({ report, onClose }: WeeklyReportViewerProps) {
  if (!report) return null;
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  async function downloadTextReport() {
    const text = report.clinical_summary;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `respicore_weekly_report_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const shimmer = `
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
  `;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{ background: "linear-gradient(135deg, #060e1a 0%, #0a1525 40%, #0d1f30 100%)" }}>
      <style>{shimmer}</style>
      {/* Animated background glow orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #1e3a5f 0%, transparent 70%)", animation: "float 20s ease-in-out infinite alternate" }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, #0f4c40 0%, transparent 70%)", animation: "float 25s ease-in-out infinite alternate-reverse" }} />

      <div className="relative z-10 flex items-start justify-center overflow-y-auto h-full py-8 px-4 backdrop-blur-md">
        <div
          className="w-full max-w-4xl rounded-[2rem] border border-[rgba(30,60,95,0.3)] shadow-2xl overflow-hidden relative"
          style={{
            background: "linear-gradient(180deg, rgba(15,25,45,0.92) 0%, rgba(10,18,30,0.97) 60%, rgba(6,12,20,0.98) 100%)",
            backdropFilter: "blur(30px) saturate(1.4)",
            WebkitBackdropFilter: "blur(30px) saturate(1.4)",
            boxShadow: "0 50px 100px -20px rgba(20,60,100,0.35), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(30,60,95,0.15)",
            animation: "fadeInUp 0.7s ease-out",
          }}
        >
          {/* Glowing top border line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-teal-400/40 to-transparent" />

          {/* Header */}
          <div className="relative px-8 py-7 border-b border-[rgba(30,60,95,0.3)] flex items-center justify-between overflow-hidden">
            {/* Background shimmer for header */}
            <div className="absolute inset-0 opacity-[0.15] pointer-events-none"
              style={{ background: "linear-gradient(90deg, transparent, rgba(20,184,166,0.15), transparent)", backgroundSize: "200% 100%", animation: "shimmer 4s infinite linear" }} />
            <div className="relative z-10">
              <h2 className="text-2xl font-extrabold text-white tracking-tight leading-tight drop-shadow-lg"
                style={{ textShadow: "0 2px 20px rgba(20,184,166,0.25)" }}>
                Weekly Clinical Report
              </h2>
              <p className="text-xs text-teal-300/60 font-mono mt-1 tracking-wide">
                Generated {new Date(report.generated_at).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-3 relative z-10">
              <button
                onClick={downloadTextReport}
                className="group relative text-xs text-teal-300/70 hover:text-teal-200 border border-teal-500/20 hover:border-teal-400/60 px-4 py-2.5 rounded-xl transition-all duration-300 overflow-hidden hover:shadow-[0_0_20px_rgba(20,184,166,0.2)] hover:-translate-y-0.5"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative">Download .txt</span>
              </button>
              <button
                onClick={onClose}
                className="group relative text-teal-300/50 hover:text-white p-2.5 rounded-xl transition-all duration-300 hover:bg-teal-500/10 hover:shadow-[0_0_15px_rgba(20,184,166,0.15)] hover:-translate-y-0.5"
                title="Close"
                aria-label="Close report"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-7 space-y-8 max-h-[72vh] overflow-y-auto custom-scrollbar">
            {/* Alerts */}
            {report.alerts.length > 0 && (
              <div className="relative overflow-hidden rounded-2xl border border-amber-400/15 bg-gradient-to-br from-amber-900/20 to-amber-950/10 p-6 shadow-[0_8px_40px_rgba(245,158,11,0.08)] hover:shadow-[0_12px_50px_rgba(245,158,11,0.12)] transition-shadow">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
                <p className="text-sm font-bold text-amber-300 tracking-wide mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#f59e0b]" />
                  {report.alerts.length} Alert{report.alerts.length > 1 ? "s" : ""}
                </p>
                <div className="space-y-2">
                  {report.alerts.map((a) => (
                    <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-amber-900/10 border border-amber-400/10 hover:border-amber-400/20 transition-colors hover:shadow-[0_4px_20px_rgba(245,158,11,0.08)]">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md shrink-0 ${a.severity === "urgent" ? "text-red-300 bg-red-500/10 border border-red-400/20" : "text-amber-300 bg-amber-500/10 border border-amber-400/20"}`}>
                        {a.severity}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-amber-200/90 leading-snug">{a.message}</p>
                        <p className="text-xs text-amber-200/40 mt-1">{a.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Respiratory Overview */}
            <section
              onMouseEnter={() => setHoveredCard("respiratory")}
              onMouseLeave={() => setHoveredCard(null)}
              className={`group relative overflow-hidden rounded-[2rem] border p-7 transition-all duration-500 ${
                hoveredCard === "respiratory"
                  ? "border-teal-400/40 shadow-[0_0_60px_rgba(20,184,166,0.15),0_20px_60px_rgba(0,0,0,0.5)] -translate-y-1"
                  : "border-[rgba(30,60,95,0.25)] shadow-[0_8px_40px_rgba(0,0,0,0.25)]"
              }`}
              style={{ background: "linear-gradient(160deg, rgba(15,30,45,0.75) 0%, rgba(8,15,25,0.85) 100%)" }}
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-teal-400/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 group-hover:bg-teal-400/10 transition-colors" />
              <h3 className="text-base font-extrabold text-white tracking-tight mb-5 relative z-10 drop-shadow-md">Respiratory Overview</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                {[
                  { label: "Total Readings", value: report.total_readings, color: "text-teal-300", sub: "last 30 days", bg: "bg-teal-500/10", border: "border-teal-400/20" },
                  { label: "Voice Recordings", value: report.voice_biomarkers.total_recordings, color: "text-violet-300", sub: "audio samples", bg: "bg-violet-500/10", border: "border-violet-400/20" },
                  { label: "Medication Logs", value: report.medication_summary.total_entries, color: "text-amber-200", sub: "tracked entries", bg: "bg-amber-500/10", border: "border-amber-400/20" },
                  { label: "Avg Cough Events", value: report.voice_biomarkers.avg_cough_count != null ? report.voice_biomarkers.avg_cough_count.toFixed(1) : "--", color: "text-orange-300", sub: "per recording", bg: "bg-orange-500/10", border: "border-orange-400/20" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl bg-[rgba(10,18,30,0.6)] border border-[rgba(30,60,95,0.15)] p-4 hover:border-teal-400/20 hover:shadow-[0_0_30px_rgba(20,184,166,0.05)] transition-all duration-300">
                    <p className="text-[10px] text-[#6a8088] uppercase tracking-widest font-medium">{item.label}</p>
                    <p className={`text-2xl font-extrabold mt-2 ${item.color}`}>{item.value}</p>
                    <p className="text-[10px] text-[#4a6570] mt-1">{item.sub}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Triage Distribution — 3D shimmer glass cards */}
            <section className="relative overflow-hidden rounded-[2rem] border border-[rgba(30,60,95,0.25)] shadow-[0_20px_60px_rgba(0,0,0,0.4)]" style={{ background: "linear-gradient(160deg, rgba(15,30,45,0.75) 0%, rgba(8,15,25,0.85) 100%)" }}>
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-teal-400/30 to-transparent" />
              <div className="p-7">
                <h3 className="text-base font-extrabold text-white tracking-tight mb-1">Triage Classification Distribution</h3>
                <p className="text-xs text-[#6a8088] mb-5">Breakdown of predicted respiratory classes across all recordings this week.</p>
                <div className="flex gap-3">
                  {[
                    { label: "Normal", count: report.triage_distribution.normal, color: "from-emerald-500/20 to-emerald-600/10", text: "text-emerald-300", border: "border-emerald-400/20", glow: "shadow-[0_8px_30px_rgba(16,185,129,0.15)]" },
                    { label: "Anomalous", count: report.triage_distribution.anomalous, color: "from-amber-500/20 to-amber-600/10", text: "text-amber-300", border: "border-amber-400/20", glow: "shadow-[0_8px_30px_rgba(245,158,11,0.1)]" },
                    { label: "Wheeze", count: report.triage_distribution.wheeze, color: "from-cyan-500/20 to-cyan-600/10", text: "text-cyan-300", border: "border-cyan-400/20", glow: "shadow-[0_8px_30px_rgba(6,182,212,0.1)]" },
                    { label: "COPD", count: report.triage_distribution.copd, color: "from-red-500/20 to-red-600/10", text: "text-red-300", border: "border-red-400/20", glow: "shadow-[0_8px_30px_rgba(239,68,68,0.1)]" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      className={`flex-1 relative overflow-hidden rounded-2xl px-5 py-5 text-center transition-all duration-300 hover:-translate-y-1 hover:${item.glow} border ${item.border}`}
                      style={{ background: `linear-gradient(135deg, ${item.color})` }}
                    >
                      {/* Shimmer overlay */}
                      <div className="absolute inset-0 opacity-[0.1] pointer-events-none" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)", backgroundSize: "200% 100%", animation: "shimmer 3s infinite linear" }} />
                      <p className="text-3xl font-extrabold relative z-10 tracking-tight drop-shadow-lg" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>{item.count}</p>
                      <p className={`text-[10px] uppercase tracking-[0.15em] mt-2 font-bold relative z-10 ${item.text}`}>{item.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Sleep Quality */}
            {report.sleep_disruption.latest_week && (
              <div className="relative overflow-hidden rounded-[2rem] border border-[rgba(30,60,95,0.2)] p-7 transition-all duration-500 hover:shadow-[0_8px_40px_rgba(30,60,95,0.2)] hover:-translate-y-0.5" style={{ background: "linear-gradient(160deg, rgba(15,30,45,0.6) 0%, rgba(8,15,25,0.8) 100%)" }}>
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-teal-400/20 to-transparent" />
                <h3 className="text-base font-extrabold text-white tracking-tight mb-1">Sleep Quality</h3>
                <p className="text-sm text-[#8aa0a8] leading-relaxed">{report.sleep_disruption.latest_week.summary}</p>
                {report.sleep_disruption.latest_week.avg_morning_spo2_all > 0 && (
                  <p className="text-xs text-[#5a7078] mt-3 font-mono bg-[#0a1220]/40 inline-block px-3 py-1 rounded-full border border-[#1a2f3a]/50">
                    Avg morning SpO2: {report.sleep_disruption.latest_week.avg_morning_spo2_all}%
                  </p>
                )}
              </div>
            )}

            {/* Inhaler Efficiency */}
            {report.inhaler_efficiency && (
              <div className={`relative overflow-hidden rounded-[2rem] border p-7 transition-all duration-300 hover:-translate-y-0.5 ${report.inhaler_efficiency.gina_flag ? "border-red-400/30 shadow-[0_8px_40px_rgba(239,68,68,0.08)]" : "border-[rgba(30,60,95,0.25)] shadow-[0_8px_40px_rgba(0,0,0,0.2)]"}`} style={{ background: "linear-gradient(160deg, rgba(15,30,45,0.75) 0%, rgba(8,15,25,0.85) 100%)" }}>
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-teal-400/20 to-transparent" />
                <h3 className="text-base font-extrabold text-white tracking-tight mb-1 flex items-center gap-2">
                  Rescue Inhaler Efficiency
                  {report.inhaler_efficiency.gina_flag && (
                    <span className="text-[10px] font-bold text-red-300 bg-red-500/10 border border-red-400/30 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.15)] animate-pulse">GINA THRESHOLD EXCEEDED</span>
                  )}
                </h3>
                <div className="grid grid-cols-3 gap-4 mt-5">
                  <div className="rounded-2xl bg-[#0a1220]/60 border border-[#1a2f3a]/50 p-4">
                    <p className="text-[10px] text-[#6a8088] uppercase tracking-widest font-medium">This Week</p>
                    <p className="text-2xl font-extrabold text-white mt-1 tracking-tight">{report.inhaler_efficiency.total_puffs_week} <span className="text-sm font-medium text-[#5a7078]">puffs</span></p>
                  </div>
                  <div className="rounded-2xl bg-[#0a1220]/60 border border-[#1a2f3a]/50 p-4">
                    <p className="text-[10px] text-[#6a8088] uppercase tracking-widest font-medium">Last Week</p>
                    <p className="text-2xl font-extrabold text-[#8aa0a8] mt-1 tracking-tight">{report.inhaler_efficiency.total_puffs_last_week} <span className="text-sm font-medium text-[#5a7078]">puffs</span></p>
                  </div>
                  <div className="rounded-2xl bg-[#0a1220]/60 border border-[#1a2f3a]/50 p-4">
                    <p className="text-[10px] text-[#6a8088] uppercase tracking-widest font-medium">Trend</p>
                    <p className={`text-2xl font-extrabold mt-1 tracking-tight ${report.inhaler_efficiency.trend === "increasing" ? "text-red-300" : report.inhaler_efficiency.trend === "decreasing" ? "text-emerald-300" : "text-[#6a8088]"}`}>
                      {report.inhaler_efficiency.trend}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[#5a7078] mt-4 font-mono bg-[#0a1220]/40 inline-block px-3 py-1 rounded-full border border-[#1a2f3a]/30">
                  Used {report.inhaler_efficiency.days_with_usage_week}/7 days {report.inhaler_efficiency.gina_flag ? "(uncontrolled per GINA)" : "(controlled)"}
                </p>
              </div>
            )}

            {/* Full Clinical Summary — premium glass card with shimmer */}
            {report.clinical_summary && (
              <div className="relative overflow-hidden rounded-[2rem] border border-[rgba(30,60,95,0.2)] shadow-[0_20px_60px_rgba(0,0,0,0.35)]" style={{ background: "linear-gradient(160deg, rgba(15,30,45,0.7) 0%, rgba(8,12,22,0.92) 100%)" }}>
                <div className="absolute top-0 right-0 w-40 h-40 bg-teal-400/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/4" />
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-teal-400/30 to-transparent" />
                <div className="relative z-10 px-7 py-7">
                  <h3 className="text-base font-extrabold text-white tracking-tight mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_#14b8a6]" />
                    Full Clinical Summary
                  </h3>
                  <pre className="text-xs text-[#8aa0a8] whitespace-pre-wrap font-mono leading-[1.8] bg-[#0a1220]/40 rounded-2xl p-5 border border-[#1a2f3a]/30 shadow-inner shadow-[inset_0_2px_20px_rgba(0,0,0,0.3)]">
                    {report.clinical_summary}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global keyframes for shimmer */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes float {
          0% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
          100% { transform: translateY(0) translateX(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a2f3a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #2a3f4a; }
      `}</style>
    </div>
  );
}
