// app/family-network/page.tsx — Family Network — redesigned
// Health green theme, glass cards, tabbed sections

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FamilyNetworkSettings from "@/components/dashboard/FamilyNetworkSettings";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FamilyNetworkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-950 to-emerald-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-emerald-800/30 bg-emerald-950/40 backdrop-blur-2xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-emerald-300/60 hover:text-emerald-200 border border-emerald-700/40 hover:border-emerald-500/50 rounded-xl p-2 transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <span className="font-extrabold text-white text-sm tracking-tight">Respi<span className="text-emerald-400">Core</span></span>
            <span className="hidden sm:inline text-[10px] font-mono text-emerald-400/50 border border-emerald-700/30 rounded-md px-2 py-0.5 uppercase tracking-widest">Family Health</span>
          </div>
          <Link href="/dashboard" className="text-xs text-emerald-200/50 hover:text-emerald-200 border border-emerald-700/30 hover:border-emerald-500/40 px-4 py-2 rounded-xl transition-all hover:bg-emerald-900/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]">Dashboard</Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-16 space-y-10">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-700/20 bg-gradient-to-br from-emerald-900/40 via-slate-900/60 to-emerald-950/80 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(16,185,129,0.1)] p-8 sm:p-12">
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-400/10 rounded-full blur-[100px] -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4" />
          <div className="relative z-10">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
              Family Health <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Network</span>
            </h1>
            <p className="text-emerald-100/50 text-sm sm:text-base mt-4 max-w-xl leading-relaxed">
              Manage roles, sharing preferences, verify your identity via SMS, and control profile access — all in one secure group space.
            </p>
            <div className="flex gap-3 mt-6">
              <span className="inline-flex items-center gap-2 text-[10px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Admin Access
              </span>
              <span className="inline-flex items-center gap-2 text-[10px] font-semibold text-teal-300 bg-teal-500/10 border border-teal-500/20 rounded-full px-3 py-1.5">
                OTP Verified
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-[1px] bg-emerald-500/40" />
            <h2 className="text-[11px] font-bold text-emerald-400/60 uppercase tracking-[0.15em]">Group Settings</h2>
          </div>
          <FamilyNetworkSettings />
        </section>
      </main>
    </div>
  );
}
