import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const projectRef =
    supabaseUrl.match(/^https:\/\/([^.]+)\.supabase\.co/i)?.[1] ?? "";
  const authCookieBase = projectRef ? `sb-${projectRef}-auth-token` : "";

  if (authCookieBase) {
    const all = request.cookies.getAll();
    for (const cookie of all) {
      if (cookie.name === authCookieBase || cookie.name.startsWith(`${authCookieBase}.`)) {
        response.cookies.set(cookie.name, "", { maxAge: 0, path: "/" });
      }
    }
  }

  return response;
}
