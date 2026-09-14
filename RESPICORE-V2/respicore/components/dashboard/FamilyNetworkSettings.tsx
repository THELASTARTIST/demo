"use client";

import { useState, useEffect } from "react";

export default function FamilyNetworkSettings() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpMsg, setOtpMsg] = useState("");
  const [members, setMembers] = useState([{ email: "", phone: "", role: "member" }]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"access" | "members" | "sharing" | "verify">("access");

  const [form, setForm] = useState({
    patient_email: "", family_email: "", patient_phone: "", family_phone: "",
    share_weekly_summaries: true, share_alert_notifications: true, share_medication_reminders: true,
    send_via_email: true, send_via_whatsapp: false, role: "admin"
  });

  useEffect(() => {
    fetch("/api/family-network").then((r) => r.json()).then((json) => {
      if (json.data) {
        setData(json.data);
        setForm({
          patient_email: json.data.patient_email || "",
          family_email: json.data.family_email || "",
          patient_phone: json.data.patient_phone || "",
          family_phone: json.data.family_phone || "",
          share_weekly_summaries: json.data.share_weekly_summaries ?? true,
          share_alert_notifications: json.data.share_alert_notifications ?? true,
          share_medication_reminders: json.data.share_medication_reminders ?? true,
          send_via_email: json.data.send_via_email ?? true,
          send_via_whatsapp: json.data.send_via_whatsapp ?? false,
          role: json.data.role || "admin"
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/family-network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, members }),
      });
      const json = await res.json();
      if (json.data) setData(json.data);
    } catch (e) { console.error("Save failed", e); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!confirm("Remove family network?")) return;
    await fetch("/api/family-network", { method: "DELETE" });
    setData(null);
    setForm({ patient_email: "", family_email: "", patient_phone: "", family_phone: "",
      share_weekly_summaries: true, share_alert_notifications: true, share_medication_reminders: true,
      send_via_email: true, send_via_whatsapp: false, role: "admin" });
  }

  async function handleSendOtp() {
    setOtpMsg("");
    const phone = form.patient_phone || form.family_phone || otpPhone;
    if (!phone) { setOtpMsg("Enter a phone number first"); return; }
    try {
      const res = await fetch("/api/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json();
      if (json.error) {
        setOtpMsg("Send failed: " + json.error);
      } else {
        setOtpMsg("OTP sent successfully to your phone. Check your SMS messages for the 6-digit verification code.");
      }
    } catch (e: any) {
      setOtpMsg("Send failed: " + (e.message || "network error"));
    }
  }

  async function handleVerifyOtp() {
    try {
      const res = await fetch("/api/otp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otpCode, phone: otpPhone || form.patient_phone || form.family_phone }),
      });
      const json = await res.json();
      if (json.error) {
        setOtpMsg("Verification failed: " + json.error);
      } else {
        setOtpMsg("Verified! Role updated to admin.");
        setForm({ ...form, role: "admin" });
        const refresh = await fetch("/api/family-network");
        const refreshJson = await refresh.json();
        if (refreshJson.data) setData(refreshJson.data);
      }
    } catch (e: any) {
      setOtpMsg("Verification failed: " + (e.message || "network error"));
    }
  }

  async function loadProfiles() {
    const res = await fetch("/api/profiles/all");
    const json = await res.json();
    if (json.data) setProfiles(json.data);
  }

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: "access", label: "Access Control" },
    { key: "members", label: "Members" },
    { key: "sharing", label: "Sharing" },
    { key: "verify", label: "Verify" },
  ];

  if (loading) return <div className="text-sm text-emerald-300/40">Loading family network...</div>;

  const verified = data?.verified === true;

  return (
    <div className="bg-gradient-to-br from-emerald-950 via-slate-950 to-emerald-900 border border-emerald-700/20 rounded-[2rem] shadow-[0_30px_80px_-30px_rgba(16,185,129,0.15)] overflow-hidden">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900/50 via-slate-900/40 to-emerald-900/30 border-b border-emerald-700/20 px-6 sm:px-8 py-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-[100px] -translate-y-1/3 translate-x-1/3" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-extrabold text-white tracking-tight">Family Health Network</h3>
              <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${form.role === "admin" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]" : "bg-amber-500/10 text-amber-300 border-amber-500/20"}`}>
                {form.role}
              </span>
              {verified && (
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-400/30 shadow-[0_0_12px_rgba(20,184,166,0.2)] flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-teal-400 animate-pulse" /> Verified
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-200/30 mt-1">Access control, members, sharing preferences, and SMS verification.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-2.5 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.4)] transition-all active:scale-[0.98]">
              {saving ? "Saving..." : "Save Network"}
            </button>
            {data && (
              <button onClick={handleDelete} className="text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 hover:border-red-400/40 px-4 py-2.5 rounded-xl transition-all hover:shadow-[0_4px_20px_rgba(239,68,68,0.15)] active:scale-[0.98]">
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 sm:px-8 pt-6 border-b border-emerald-800/20 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`text-xs font-semibold px-4 py-2.5 rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
              activeTab === t.key
                ? "text-white border-emerald-400 bg-emerald-900/30 shadow-[inset_0_2px_10px_rgba(16,185,129,0.08)]"
                : "text-emerald-200/30 border-transparent hover:text-emerald-200/60 hover:border-emerald-700/30 hover:bg-emerald-900/10"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6 sm:p-8 space-y-8">
        {/* Tab: Access */}
        {activeTab === "access" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <section className="bg-gradient-to-br from-slate-900/60 to-emerald-950/40 border border-emerald-700/20 rounded-2xl p-6 shadow-inner shadow-emerald-900/10 backdrop-blur-sm">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-5">Network Role</h4>
              <div className="flex items-center gap-4">
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="text-sm bg-slate-950/60 border border-emerald-700/30 text-emerald-100 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 transition-all w-40"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${form.role === "admin" ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" : "text-amber-300 bg-amber-500/10 border-amber-500/20"}`}>
                  {form.role === "admin" ? "Full control" : "Limited access"}
                </span>
              </div>
            </section>

            <section className="bg-gradient-to-br from-slate-900/60 to-emerald-950/40 border border-emerald-700/20 rounded-2xl p-6 shadow-inner shadow-emerald-900/10 backdrop-blur-sm">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-5">Contact Info</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input className="text-sm bg-slate-950/50 border border-emerald-700/20 rounded-xl px-4 py-3 text-emerald-100 placeholder-emerald-400/20 focus:outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/10 transition-all" placeholder="Patient email" value={form.patient_email} onChange={(e) => setForm({ ...form, patient_email: e.target.value })} />
                <input className="text-sm bg-slate-950/50 border border-emerald-700/20 rounded-xl px-4 py-3 text-emerald-100 placeholder-emerald-400/20 focus:outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/10 transition-all" placeholder="Family email" value={form.family_email} onChange={(e) => setForm({ ...form, family_email: e.target.value })} />
                <input className="text-sm bg-slate-950/50 border border-emerald-700/20 rounded-xl px-4 py-3 text-emerald-100 placeholder-emerald-400/20 focus:outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/10 transition-all" placeholder="Patient phone" value={form.patient_phone} onChange={(e) => setForm({ ...form, patient_phone: e.target.value })} />
                <input className="text-sm bg-slate-950/50 border border-emerald-700/20 rounded-xl px-4 py-3 text-emerald-100 placeholder-emerald-400/20 focus:outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/10 transition-all" placeholder="Family phone" value={form.family_phone} onChange={(e) => setForm({ ...form, family_phone: e.target.value })} />
              </div>
            </section>
          </div>
        )}

        {/* Tab: Members */}
        {activeTab === "members" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white tracking-tight">Network Members</h4>
              <button onClick={() => setMembers([...members, { email: "", phone: "", role: "member" }])} className="text-xs font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 hover:border-emerald-400/40 rounded-xl px-3 py-2 transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                + Add Member
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((m, i) => (
                <div key={i} className="group relative bg-gradient-to-br from-slate-900/70 to-emerald-950/30 border border-emerald-700/20 hover:border-emerald-400/40 rounded-2xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(16,185,129,0.08)] transition-all hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${m.role === "admin" ? "text-emerald-300 bg-emerald-500/10 border-emerald-400/30" : "text-slate-400 bg-slate-700/30 border-slate-600/20"}`}>
                      {m.role}
                    </span>
                    <button onClick={() => setMembers(members.filter((_, idx) => idx !== i))} className="text-red-400/40 hover:text-red-300 hover:bg-red-500/10 p-1 rounded-md transition-colors" aria-label="Remove">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" /></svg>
                    </button>
                  </div>
                  <input className="w-full text-sm bg-slate-950/40 border border-emerald-700/15 rounded-xl px-3 py-2.5 text-emerald-100 placeholder-emerald-400/15 focus:outline-none focus:border-emerald-400/40 focus:ring-1 focus:ring-emerald-400/20 transition-all mb-2" placeholder="Member email" value={m.email} onChange={(e) => { const next = [...members]; next[i].email = e.target.value; setMembers(next); }} />
                  <select className="w-full text-sm bg-slate-950/40 border border-emerald-700/15 rounded-xl px-3 py-2.5 text-emerald-100 focus:outline-none focus:border-emerald-400/40 transition-all cursor-pointer" value={m.role} onChange={(e) => { const next = [...members]; next[i].role = e.target.value; setMembers(next); }}>
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Sharing */}
        {activeTab === "sharing" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h4 className="text-sm font-bold text-white tracking-tight">Sharing Preferences</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Weekly Summaries", key: "share_weekly_summaries" },
                { label: "Alert Notifications", key: "share_alert_notifications" },
                { label: "Medication Reminders", key: "share_medication_reminders" },
              ].map((item) => (
                <label key={item.key} className="group flex items-center gap-4 bg-gradient-to-br from-slate-900/40 to-emerald-950/20 border border-emerald-700/15 hover:border-emerald-400/30 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.08)] hover:-translate-y-0.5">
                  <input
                    type="checkbox"
                    checked={(form as any)[item.key]}
                    onChange={(e) => setForm({ ...form, [item.key]: e.target.checked })}
                    className="w-5 h-5 accent-emerald-500 rounded-md border-emerald-700/40 text-emerald-500 focus:ring-emerald-400/30"
                  />
                  <span className="text-sm font-medium text-emerald-100 group-hover:text-white transition-colors">{item.label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-3 bg-gradient-to-br from-slate-900/40 to-emerald-950/20 border border-emerald-700/15 rounded-2xl px-5 py-4 hover:border-emerald-400/20 transition-all cursor-pointer">
                <input type="checkbox" checked={form.send_via_email} onChange={(e) => setForm({ ...form, send_via_email: e.target.checked })} className="w-5 h-5 accent-emerald-500 rounded-md" />
                <span className="text-sm font-medium text-emerald-100">Send via Email</span>
              </label>
              <label className="flex items-center gap-3 bg-gradient-to-br from-slate-900/40 to-emerald-950/20 border border-emerald-700/15 rounded-2xl px-5 py-4 hover:border-emerald-400/20 transition-all cursor-pointer">
                <input type="checkbox" checked={form.send_via_whatsapp} onChange={(e) => setForm({ ...form, send_via_whatsapp: e.target.checked })} className="w-5 h-5 accent-emerald-500 rounded-md" />
                <span className="text-sm font-medium text-emerald-100">Send via WhatsApp</span>
              </label>
            </div>
          </div>
        )}

        {/* Tab: Verify */}
        {activeTab === "verify" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-gradient-to-r from-emerald-900/30 via-slate-900/40 to-teal-900/30 border border-emerald-700/20 rounded-3xl p-8 shadow-[0_20px_60px_-15px_rgba(16,185,129,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-[100px] -translate-y-1/3 translate-x-1/4" />
              <div className="relative z-10">
                <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-2">OTP Verification</h4>
                <p className="text-xs text-emerald-200/40 mb-6">Step 1: Click Send → SMS delivered to your phone with a 6-digit code. Step 2: Check your messages. Step 3: Enter the code and click Verify.</p>
                <div className="flex gap-2 mb-4">
                  <input className="flex-1 text-sm bg-slate-950/50 border border-emerald-700/20 rounded-xl px-4 py-3 text-emerald-100 placeholder-emerald-400/20 focus:outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/10 transition-all" placeholder="Phone number" value={otpPhone} onChange={(e) => setOtpPhone(e.target.value)} />
                  <button onClick={handleSendOtp} className="text-xs font-bold bg-gradient-to-r from-amber-500/15 to-amber-600/10 border border-amber-400/30 text-amber-300 px-5 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:border-amber-400/50 transition-all active:scale-[0.98]">Send OTP</button>
                </div>
                <div className="flex gap-2">
                  <input className="w-36 text-sm bg-slate-950/50 border border-emerald-700/20 rounded-xl px-4 py-3 text-emerald-100 placeholder-emerald-400/20 focus:outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/10 transition-all font-mono tracking-[0.2em] text-center" placeholder="6-digit" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} />
                  <button onClick={handleVerifyOtp} className="text-xs font-bold bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border border-emerald-400/30 text-emerald-300 px-5 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:border-emerald-300/50 transition-all active:scale-[0.98]">Verify</button>
                </div>
                {otpMsg && (
                  <div className={`mt-4 rounded-xl border p-4 text-xs leading-relaxed ${otpMsg.includes("sent") ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-100" : otpMsg.includes("Verified") ? "bg-teal-500/10 border-teal-400/20 text-teal-100" : otpMsg.includes("failed") ? "bg-red-500/10 border-red-400/20 text-red-200" : "bg-slate-800/40 border-slate-600/20 text-slate-300"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">📱</span>
                      <span className="font-bold text-white">SMS Delivery</span>
                    </div>
                    <div>
                      {otpMsg.includes("sent") || otpMsg.includes("Successfully") ? (
                        <>
                          SMS delivered to your phone. Please check your messages for the 6-digit verification code.
                          <br />
                          <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-400/20 inline-block mt-2">Code delivered only via SMS — not shown here.</span>
                        </>
                      ) : (
                        <span>{otpMsg}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profile Access — shown in all tabs at bottom */}
        <div className="border-t border-emerald-700/10 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">All Profiles (Admin Access)</h4>
            <button onClick={loadProfiles} className="text-[10px] font-semibold text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10 border border-emerald-700/20 hover:border-emerald-400/30 px-3 py-1.5 rounded-lg transition-all">Load Profiles</button>
          </div>
          {profiles.length > 0 && (
            <div className="bg-gradient-to-br from-slate-900/60 to-emerald-950/20 border border-emerald-700/15 rounded-2xl p-4 max-h-52 overflow-y-auto space-y-3 shadow-inner shadow-emerald-900/5">
              {profiles.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between text-sm text-emerald-100/80 border-b border-emerald-700/10 pb-2 last:border-0 last:pb-0">
                  <span className="font-medium">{p.full_name || "No name"} <span className="text-emerald-500/40 text-xs">({p.country || "—"}, {p.region || "—"}, {p.city || "—"})</span></span>
                  <span className="text-[10px] text-emerald-400/30 font-mono">{p.id.slice(0, 8)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
