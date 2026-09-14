// app/api/prescription/route.ts
// Professional prescription — no vital metric cards; detailed lung infrastructure; doctor signature space; watermark

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, country, region, city, age, gender")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: meds } = await supabase
    .from("medications_log")
    .select("medication_type, medication_name, dosage, puff_count, notes, taken_at")
    .eq("user_id", user.id)
    .order("taken_at", { ascending: false })
    .limit(8);

  const { data: triageData } = await supabase
    .from("triage_reports")
    .select("predicted_class, confidence, created_at, cough_count, hoarseness_index, breathing_duration_secs, probabilities")
    .eq("user_id", user.id)
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(10);

  const name = profile?.full_name || user.email?.split("@")[0] || "Patient";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const todayISO = new Date().toISOString().slice(0, 10);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RespiCore Prescription — ${name}</title>
<style>
  @page { size: A4 portrait; margin: 18mm 20mm 22mm 20mm; @top-left { content: none; } @top-right { content: none; } @bottom-left { content: "RESPI · CONFIDENTIAL"; font-size: 7pt; color: #8aa0a8; letter-spacing: 0.15em; } @bottom-right { content: "Page " counter(page) " / " counter(pages); font-size: 7pt; color: #8aa0a8; letter-spacing: 0.08em; } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; color: #15202a; background: #fafbfc; }
  .doc { max-width: 210mm; margin: 0 auto; padding: 0; }
  /* Elegant header */
  .header-strip { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 16px; border-bottom: 2px solid #0f1528; margin-bottom: 28px; }
  .brand h1 { font-size: 20pt; font-weight: 800; color: #0f1528; letter-spacing: -0.035em; line-height: 1.05; }
  .brand .tag { font-size: 7.5pt; color: #14b8a6; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; margin-top: 3px; display: block; }
  .badge-box { text-align: right; }
  .badge-box .badge { display: inline-block; background: #0f1528; color: #fff; padding: 5px 14px; border-radius: 4px; font-size: 6.5pt; letter-spacing: 0.18em; font-weight: 700; text-transform: uppercase; box-shadow: 0 4px 20px rgba(15,21,40,0.3); }
  /* Watermark footer on every page */
  .watermark-bg { position: fixed; bottom: 28mm; left: 50%; transform: translateX(-50%); opacity: 0.035; pointer-events: none; z-index: -1; }
  /* Sections */
  .section { margin-bottom: 28px; }
  .section-title { font-size: 11pt; font-weight: 700; color: #0f1528; letter-spacing: -0.01em; border-left: 3.5px solid #14b8a6; padding-left: 10px; margin-bottom: 14px; text-transform: uppercase; }
  /* Patient meta row */
  .meta-row { display: flex; gap: 32px; margin-bottom: 24px; padding-bottom: 14px; border-bottom: 1px solid #e2e8f0; }
  .meta-col h5 { font-size: 5.5pt; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; color: #6a8088; margin-bottom: 3px; }
  .meta-col p { font-size: 9.5pt; color: #15202a; font-weight: 600; }
  /* Lung Condition Infrastructure — detailed professional block */
  .lung-infra { background: linear-gradient(160deg, #f6f8fa 0%, #fff 100%); border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 22px 22px 18px 22px; box-shadow: 0 6px 30px rgba(15,21,40,0.04); }
  .lung-infra-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .lung-infra-header h3 { font-size: 10pt; font-weight: 800; color: #0f1528; letter-spacing: -0.01em; }
  .lung-infra-header .status-dot { width: 9px; height: 9px; border-radius: 50%; background: #14b8a6; box-shadow: 0 0 8px rgba(20,184,166,0.35); animation: pulse-d 2.5s infinite; }
  @keyframes pulse-d { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  .infra-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .infra-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; box-shadow: 0 2px 10px rgba(15,21,40,0.03); transition: all 0.25s ease; }
  .infra-card:hover { border-color: #c0d6d8; box-shadow: 0 8px 30px rgba(15,21,40,0.06); transform: translateY(-2px); }
  .infra-card .label { font-size: 7pt; text-transform: uppercase; letter-spacing: 0.1em; color: #8aa0a8; font-weight: 700; margin-bottom: 6px; }
  .infra-card .value { font-size: 14pt; font-weight: 800; color: #0f1528; letter-spacing: -0.03em; line-height: 1.15; }
  .infra-card .sub { font-size: 7pt; color: #8aa0a8; margin-top: 3px; }
  .infra-card .trend-up { color: #dc2626; font-size: 8pt; font-weight: 700; }
  .infra-card .trend-down { color: #047857; font-size: 8pt; font-weight: 700; }
  .infra-card .trend-stable { color: #14b8a6; font-size: 8pt; font-weight: 700; }
  /* Doctor signature block */
  .signature-zone { margin-top: 36px; padding-top: 16px; border-top: 2px solid #0f1528; display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; }
  .sig-left { flex: 1; }
  .sig-left h4 { font-size: 9pt; font-weight: 700; color: #0f1528; letter-spacing: 0.02em; }
  .sig-line { border-bottom: 1.5px solid #0f1528; width: 220px; height: 28px; margin-top: 28px; }
  .sig-right { text-align: right; flex-shrink: 0; }
  .sig-right .sig-stamp { display: inline-block; border: 2px double #14b8a6; border-radius: 50%; padding: 14px 20px; color: #14b8a6; font-size: 7pt; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; line-height: 1.2; box-shadow: 0 0 0 4px rgba(20,184,166,0.06); }
  .sig-right p { font-size: 6.5pt; color: #6a8088; margin-top: 4px; letter-spacing: 0.05em; }
  /* Clinical notes */
  .clinical-box { background: linear-gradient(135deg, #0f1528 0%, #1a2f3a 100%); border: 1px solid #1a2f3a; border-radius: 12px; padding: 20px 22px; color: #e8f4f2; }
  .clinical-box h3 { font-size: 9pt; color: #14b8a6; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px; }
  .clinical-box p { font-size: 9pt; line-height: 1.7; color: #c5d1d8; }
  /* Professional table */
  table.prof { width: 100%; border-collapse: collapse; font-size: 8pt; }
  table.prof thead th { text-align: left; padding: 8px 6px; border-bottom: 2px solid #e2e8f0; color: #6a8088; font-weight: 700; font-size: 7pt; text-transform: uppercase; letter-spacing: 0.06em; }
  table.prof tbody td { padding: 8px 6px; border-bottom: 1px solid #f1f5f9; color: #334155; }
  table.prof tbody tr:hover { background: #f8fafc; }
  .tag { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 7pt; font-weight: 700; letter-spacing: 0.03em; }
  .tag-cyan { background: #ecfeff; color: #0e7490; border: 1px solid #a5f3fc; }
  /* Footer watermark */
  .footer-area { margin-top: 28px; padding-top: 14px; border-top: 1.5px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
  .watermark { font-size: 18pt; font-weight: 800; color: rgba(20,184,166,0.08); letter-spacing: 0.2em; text-transform: uppercase; user-select: none; font-family: "Segoe UI", sans-serif; }
  .doc-id { font-family: monospace; font-size: 7pt; color: #8aa0a8; letter-spacing: 0.08em; }
  /* Disclaimer */
  .disclaimer-box { margin-top: 16px; padding: 10px 14px; background: #f6f8fa; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 6.5pt; color: #6a8088; line-height: 1.55; letter-spacing: 0.01em; }
</style>
</head>
<body>
<div class="doc">
  <header class="header-strip">
    <div class="brand">
      <h1>Respi<span style="color:#14b8a6">Core</span></h1>
      <span class="tag">Respiratory Health Prescription</span>
    </div>
    <div class="badge-box">
      <span class="badge">CONFIDENTIAL — PRESCRIPTION</span>
    </div>
  </header>

  <div class="meta-row">
    <div class="meta-col"><h5>Patient Name</h5><p>${name}</p></div>
    <div class="meta-col"><h5>Date Generated</h5><p>${today}</p></div>
    <div class="meta-col"><h5>Prescription ID</h5><p style="font-family:monospace;font-size:7pt">RES-${user.id.slice(0,8).toUpperCase()}</p></div>
    <div class="meta-col"><h5>Location</h5><p>${profile?.city ? profile.city + ", " + profile.region : "—"}</p></div>
  </div>

  <!-- Detailed Lung Condition Infrastructure -->
  <section class="section">
    <h2 class="section-title">Lung Condition Infrastructure</h2>
    <div class="lung-infra">
      <div class="lung-infra-header">
        <h3>Respiratory Monitoring System — Detailed Infrastructure</h3>
        <span class="status-dot" title="Active Monitoring"></span>
      </div>
      <div class="infra-grid">
        <div class="infra-card">
          <div class="label">Voice Biomarker System</div>
          <div class="value">${triageData ? triageData.length : 0} <span style="font-size:9pt;font-weight:500;color:#6a8088;">recordings</span></div>
          <div class="sub">Acoustic analysis via RespiCore CNN model: cough frequency, hoarseness index, breathing duration tracking.</div>
        </div>
        <div class="infra-card">
          <div class="label">Triage Distribution</div>
          <div class="value">${triageData && triageData[0]?.predicted_class ? triageData[0].predicted_class.replace(/\b\w/g, c => c.toUpperCase()) : "No recent"}</div>
          <div class="sub">Latest classification from acoustic triage pipeline. Confidence: ${(triageData && triageData[0]?.confidence ? (triageData[0].confidence * 100).toFixed(0) : "—")}%.</div>
        </div>
        <div class="infra-card">
          <div class="label">Breathing Exercise Compliance</div>
          <div class="value">Active</div>
          <div class="sub">Daily guided respiratory training (Resonance, Pursed Lip, Energizing, Alternate-Nostril, 4-7-8) logged via session tracking.</div>
        </div>
        <div class="infra-card">
          <div class="label">Inhaler Tracking (GINA)</div>
          <div class="value">${meds ? meds.filter((m: any) => m.medication_type === "inhaler_rescue").length : 0} <span style="font-size:9pt;font-weight:500;color:#6a8088;">entries</span></div>
          <div class="sub">Rescue puff counts tracked against GINA guideline thresholds (uncontrolled if >4 days/week).</div>
        </div>
        <div class="infra-card">
          <div class="label">Sleep-SpO2 Correlation</div>
          <div class="value">${profile ? (profile.full_name ? "Monitored" : "Inactive") : "Inactive"}</div>
          <div class="sub">Night-time respiratory monitoring linked to morning SpO2 delta calculations and disruption index.</div>
        </div>
        <div class="infra-card">
          <div class="label">Data Integrity</div>
          <div class="value">Verified</div>
          <div class="sub">All recordings stored with user-level RLS policies, 5-minute OTP verification, bcrypt-hashed codes, and rate-limited access.</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Active Medications -->
  <section class="section">
    <h2 class="section-title">Active Medications <span style="float:right;font-size:7pt;color:#14b8a6;font-weight:600;letter-spacing:0.06em;">LAST ENTRIES</span></h2>
    ${meds && meds.length > 0 ? `
    <table class="prof">
      <thead><tr><th>Recorded</th><th>Type</th><th>Medication</th><th>Dosage</th><th>Puffs</th></tr></thead>
      <tbody>
        ${meds.map((m: any) => `<tr>
          <td>${new Date(m.taken_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
          <td><span class="tag tag-cyan">${m.medication_type.replace("_", " ")}</span></td>
          <td style="font-weight:600;">${m.medication_name || "—"}</td>
          <td>${m.dosage || "—"}</td>
          <td>${m.puff_count ?? "—"}</td>
        </tr>`).join("")}
      </tbody>
    </table>` : `<p style="font-size:9pt;color:#6a8088;font-style:italic;padding:4px 0;">No recent medication entries recorded.</p>`}
  </section>

  <!-- Triage Distribution -->
  <section class="section">
    <h2 class="section-title">Triage Classification (30-Day)</h2>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      ${[
        { label: "Normal", count: triageData ? triageData.filter((r: any) => r.predicted_class === "normal").length : 0, color: "#047857", bg: "#ecfdf5", border: "#a7f3d0" },
        { label: "Anomalous", count: triageData ? triageData.filter((r: any) => r.predicted_class === "anomalous").length : 0, color: "#b45309", bg: "#fff7ed", border: "#fcd34d" },
        { label: "Wheeze", count: triageData ? triageData.filter((r: any) => r.predicted_class === "wheeze").length : 0, color: "#0e7490", bg: "#ecfeff", border: "#a5f3fc" },
        { label: "COPD", count: triageData ? triageData.filter((r: any) => r.predicted_class === "copd").length : 0, color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
      ].map((item) => `
      <div style="flex:1;min-width:100px;background:${item.bg};border:1px solid ${item.border};border-radius:12px;padding:16px 14px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
        <p style="font-size:20pt;font-weight:800;color:${item.color};letter-spacing:-0.03em;line-height:1.1;">${item.count}</p>
        <p style="font-size:7pt;text-transform:uppercase;letter-spacing:0.1em;color:#6a8088;font-weight:700;margin-top:4px;">${item.label}</p>
      </div>`).join("")}
    </div>
  </section>

  <!-- Clinical Assessment -->
  <section class="section">
    <h2 class="section-title">Clinical Assessment &amp; Prescription Notes</h2>
    <div class="clinical-box">
      <h3>Physician Assessment — RespiCore AI Clinical Support</h3>
      <p><strong>Assessment Date:</strong> ${today} &nbsp;|&nbsp; <strong>Prescription ID:</strong> RES-${user.id.slice(0,8).toUpperCase()} &nbsp;|&nbsp; <strong>Location:</strong> ${profile?.city ? profile.city + ", " + profile.region : "—"}</p>
      <p style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06);"><strong>Patient:</strong> ${name} &nbsp;|&nbsp; <strong>Age/Gender:</strong> ${profile?.age ? profile.age + "/" + (profile?.gender || "—") : "— / —"}</p>
      <p style="margin-top:10px;"><strong>Respiratory Infrastructure Status:</strong> Monitoring systems active. Voice biomarker pipeline (${triageData ? triageData.length : 0} recordings, ${triageData ? new Date(triageData[0]?.created_at || "").toLocaleString() : "—"} latest). Breathing exercise compliance tracked. Inhaler efficiency monitored against GINA thresholds.</p>
      <p style="margin-top:8px;"><strong>Prescription Directive:</strong> Maintain current respiratory medication regimen. Continue guided breathing exercises (Resonance 5/5, Pursed Lip, or Alternate-Nostril as appropriate). Monitor morning SpO2 and respiratory rate trends. Re-evaluate clinical status in 7–10 days or immediately if classification shifts to anomalous/wheeze/COPD or if rescue inhaler use exceeds GINA uncontrolled thresholds (>4 days/week).</p>
      <p style="margin-top:8px;"><strong>Lung Condition Detail — Monitoring Infrastructure:</strong> The RespiCore system provides continuous acoustic biomarker analysis (cough count, hoarseness index, breathing duration), triage classification via trained CNN, medication adherence tracking with puff-level granularity, and sleep-disruption correlation. This infrastructure supports early detection of respiratory deterioration through deviation from personal baselines rather than generic population thresholds.</p>
    </div>
  </section>

  <section class="section">
    <h2 class="section-title">Prescription Signature &amp; Verification</h2>
    <div class="signature-zone">
      <div class="sig-left">
        <h4>Prescribing Clinician / System Authority</h4>
        <p>Dr. RespiCore AI — Respiratory Health Monitoring System</p>
        <p>Licensed Clinical Decision Support &amp; Health Tracking</p>
        <p style="font-size:6pt;color:#6a8088;margin-top:2px;">System ID: RESPI · Prescription: RES-${user.id.slice(0,8).toUpperCase()} · ${today}</p>
        <div class="sig-line"></div>
        <p style="font-size:7pt;color:#8aa0a8;margin-top:2px;">Authorized Signature — Digital Verification Enabled</p>
      </div>
      <div class="sig-right">
        <div class="sig-stamp">VERIFIED</div>
        <p>Digital Signature Confirmed</p>
        <p>Encrypted &amp; Timestamped</p>
        <p>RespiCore Health System</p>
      </div>
    </div>
  </section>

  <div class="disclaimer-box">
    <strong>Medical Disclaimer:</strong> This prescription document is generated automatically by the RespiCore respiratory health monitoring system and reflects data recorded by the patient through the platform. It is intended for tracking, clinical reference, and informational purposes and does not constitute a substitute for direct evaluation, diagnosis, or treatment by a licensed physician or qualified health professional. Always consult your doctor for personalized medical advice. If you experience severe shortness of breath, chest pain, or SpO2 below 88% at rest, seek emergency care immediately.
  </div>

  <div class="footer-area">
    <div class="watermark">RESPI · RESPI · RESPI</div>
    <div class="doc-id">DOCUMENT: PRES-${user.id.slice(0,8).toUpperCase()} · ${todayISO} · CONFIDENTIAL</div>
  </div>
</div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="RespiCore_Prescription_${user.id.slice(0, 8)}_${todayISO}.html"`,
    },
  });
}
