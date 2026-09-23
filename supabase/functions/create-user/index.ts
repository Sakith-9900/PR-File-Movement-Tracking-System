import { createClient } from "npm:@supabase/supabase-js@2.95.3";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers });
  if (request.method !== "POST") return reply(405, { error: "Method not allowed." });
  try {
    const token = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return reply(401, { error: "Please sign in." });
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: identity, error: authError } = await admin.auth.getUser(token);
    if (authError || !identity.user) return reply(401, { error: "Your session has expired. Please sign in again." });
    const { data: caller, error: roleError } = await admin.from("users").select("role, is_active").eq("id", identity.user.id).single();
    if (roleError || caller?.role !== "leader" || caller?.is_active !== true) {
      return reply(403, { error: "Only active administrators can create users." });
    }
    let body;
    try { body = await request.json(); } catch { return reply(400, { error: "Invalid request." }); }
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = body?.password;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return reply(400, { error: "Enter a valid email address." });
    if (typeof password !== "string" || password.length < 6) return reply(400, { error: "Password must contain at least 6 characters." });
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) return reply(400, { error: error.message });
    const { error: profileError } = await admin.from("users").upsert({
      id: data.user.id, email, short_code: email.split("@")[0].toUpperCase(),
      role: "worker", employee_id: null, is_active: true,
    });
    if (profileError) {
      const { error: rollbackError } = await admin.auth.admin.deleteUser(data.user.id);
      if (rollbackError) {
        console.error("Account cleanup failed", data.user.id);
        return reply(500, { error: "Profile creation failed. Ask your system administrator to remove the incomplete account in Supabase before retrying." });
      }
      return reply(500, { error: "Could not save the user profile. No account was created. Check the users table configuration." });
    }
    return reply(201, { user: { id: data.user.id, email } });
  } catch {
    return reply(500, { error: "Unable to create user. Please try again." });
  }
});