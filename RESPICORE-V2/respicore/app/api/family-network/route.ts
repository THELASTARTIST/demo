// app/api/family-network/route.ts
// GET    /api/family-network  -> fetch the caller's family network config
// POST   /api/family-network  -> create (upsert) the caller's family network config
//
// Strict access control: exactly two emails (the patient and one family member)
// are enforced server-side. Mobile numbers are optional. Sharing + delivery
// toggles are stored as booleans.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface FamilyNetworkRow {
  id: string;
  user_id: string;
  patient_email: string;
  family_email: string;
  patient_phone: string | null;
  family_phone: string | null;
  share_weekly_summaries: boolean;
  share_alert_notifications: boolean;
  share_medication_reminders: boolean;
  send_via_email: boolean;
  send_via_whatsapp: boolean;
  created_at: string;
  updated_at: string;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("family_network")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<FamilyNetworkRow>();

  if (error) {
    console.error("[API] family_network SELECT error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? null });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patientEmail = String(body.patient_email ?? "").trim();
  const familyEmail = String(body.family_email ?? "").trim();

  if (!patientEmail || !familyEmail) {
    return NextResponse.json(
      { error: "Both the patient and family member email addresses are required." },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(patientEmail)) {
    return NextResponse.json(
      { error: "The patient email address is not valid." },
      { status: 400 }
    );
  }
  if (!emailRegex.test(familyEmail)) {
    return NextResponse.json(
      { error: "The family member email address is not valid." },
      { status: 400 }
    );
  }

  const toBool = (v: unknown): boolean =>
    v === true || v === "true" || v === 1 || v === "1";

  const payload = {
    user_id: user.id,
    role: String(body.role ?? "admin").trim() || "admin",
    patient_email: patientEmail,
    family_email: familyEmail,
    patient_phone: String(body.patient_phone ?? "").trim() || null,
    family_phone: String(body.family_phone ?? "").trim() || null,
    share_weekly_summaries: toBool(body.share_weekly_summaries),
    share_alert_notifications: toBool(body.share_alert_notifications),
    share_medication_reminders: toBool(body.share_medication_reminders),
    send_via_email: toBool(body.send_via_email),
    send_via_whatsapp: toBool(body.send_via_whatsapp),
  };

  // Upsert: one family network per user (enforced by unique(user_id)).
  const { data, error } = await supabase
    .from("family_network")
    .upsert(payload, { onConflict: "user_id" })
    .select()
    .single<FamilyNetworkRow>();

  if (error) {
    console.error("[API] family_network UPSERT error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("family_network")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    console.error("[API] family_network DELETE error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: null, message: "Family network removed." });
}