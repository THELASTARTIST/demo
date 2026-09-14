// app/api/profiles/route.ts
// GET  /api/profiles  -> fetch current profile with geographic fields
// PATCH /api/profiles  -> update country, region, city

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    .from("profiles")
    .select("id, full_name, avatar_url, date_of_birth, country, region, city, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[API] profiles SELECT error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? null });
}

export async function PATCH(request: NextRequest) {
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

  const payload: Record<string, unknown> = {};
  if (body.country !== undefined) payload.country = String(body.country ?? "").trim() || null;
  if (body.region !== undefined) payload.region = String(body.region ?? "").trim() || null;
  if (body.city !== undefined) payload.city = String(body.city ?? "").trim() || null;

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "No valid geographic fields provided." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", user.id)
    .select("id, full_name, avatar_url, date_of_birth, country, region, city, created_at, updated_at")
    .single();

  if (error) {
    console.error("[API] profiles UPDATE error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
