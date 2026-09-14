// app/api/otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import twilio from "twilio";
import bcrypt from "bcryptjs";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;

function getTwilioClient() {
  if (!TWILIO_SID || !TWILIO_TOKEN) return null;
  return twilio(TWILIO_SID, TWILIO_TOKEN);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const phone = String(body.phone ?? "").trim();
  if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 });

  // Rate limit check
  const { data: rateData } = await supabase
    .from("otp_rate_limits")
    .select("attempts, last_attempt")
    .eq("phone", phone)
    .single();
  if (rateData) {
    const last = new Date(rateData.last_attempt);
    const minutesSince = (new Date().getTime() - last.getTime()) / 60000;
    if (minutesSince < 15 && rateData.attempts >= 3) {
      return NextResponse.json({ error: "Too many OTP requests. Please wait 15 minutes." }, { status: 429 });
    }
    await supabase.from("otp_rate_limits").update({
      attempts: minutesSince >= 15 ? 1 : rateData.attempts + 1,
      last_attempt: new Date().toISOString(),
    }).eq("phone", phone);
  } else {
    await supabase.from("otp_rate_limits").insert({ phone, attempts: 1, last_attempt: new Date().toISOString() });
  }

  const rawCode = generateCode();
  const hashedCode = await bcrypt.hash(rawCode, 10);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const { error: insertError } = await supabase
    .from("otp_codes")
    .insert({ user_id: user.id, code: hashedCode, phone, used: false, expires_at: expiresAt });

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  // MSG91 SMS delivery
  const msg91Authkey = process.env.MSG91_AUTHKEY;
  const msg91Sender = process.env.MSG91_SENDER || "RESPI";
  const msg91Route = process.env.MSG91_ROUTE || "4";
  const msg91TemplateId = process.env.MSG91_TEMPLATE_ID || "";

  try {
    const msgBody = `Your RespiCore verification code is: ${rawCode}. This code expires in 5 minutes.`;
    const msg91Payload: any = {
      authkey: msg91Authkey,
      mobile: (() => {
        let num = phone.replace(/^\+/, "").replace(/\D/g, "");
        if (num.length === 10 && num.startsWith("9") || num.startsWith("8") || num.startsWith("7") || num.startsWith("6")) num = "91" + num;
        else if (!num.startsWith("91")) num = "91" + num;
        return num;
      })(),
      message: msgBody,
      sender: msg91Sender,
      route: msg91Route,
    };
    if (msg91TemplateId) msg91Payload.template_id = msg91TemplateId;

    const msg91Res = await fetch("https://api.msg91.com/api/v2/sendsms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg91Payload),
    });
    const msg91Json = await msg91Res.json();
    if (!msg91Res.ok || msg91Json.type !== "success") {
      console.error("MSG91 SMS error:", msg91Json);
    } else {
      console.log(`[MSG91 SMS SENT] Phone: ${phone} | Code: ${rawCode}`);
    }
  } catch (smsErr: any) {
    console.error("MSG91 SMS error:", smsErr);
  }

  // Do NOT expose the raw code in the response
  return NextResponse.json({ data: { sent: true, phone }, error: null });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const code = String(body.code ?? "").trim();
  const phone = String(body.phone ?? "").trim();

  const { data, error } = await supabase
    .from("otp_codes")
    .select("*")
    .eq("user_id", user.id)
    .eq("phone", phone)
    .eq("used", false)
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });

  const codeMatch = await bcrypt.compare(code, data.code);
  if (!codeMatch) return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });

  await supabase.from("otp_codes").update({ used: true }).eq("id", data.id);
  await supabase.from("family_network").update({ verified: true }).eq("user_id", user.id);

  return NextResponse.json({ data: { verified: true }, error: null });
}
