import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX ?? "";

const joinUrl = (...parts: string[]) =>
  parts
    .filter(Boolean)
    .map((p, i) => (i === 0 ? p.replace(/\/+$/, "") : p.replace(/^\/+/, "")))
    .join("/");

export async function POST(req: Request) {
  const body = await req.json();

  const url = joinUrl(API_BASE, API_PREFIX, "/auth/login");

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const raw = await r.text();
  if (!r.ok) return new NextResponse(raw, { status: r.status });

  const data = JSON.parse(raw) as { access_token: string; user: any };

  const res = NextResponse.json({ user: data.user });
  res.cookies.set("access_token", data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return res;
}
