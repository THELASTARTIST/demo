// app/api/profiles/all/route.ts
// Admin-only: fetch all profiles globally (requires admin role on family_network)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: net, error: netErr } = await supabase
    .from("family_network")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (netErr || !net) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (net.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const { data, error } = await supabase.from("profiles").select("id, full_name, avatar_url, date_of_birth, country, region, city, created_at, updated_at").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data ?? [] });
}
