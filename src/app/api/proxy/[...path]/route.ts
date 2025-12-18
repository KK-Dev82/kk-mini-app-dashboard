// src/app/api/proxy/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ""; // เช่น https://xxxx.ngrok-free.app

function joinUrl(base: string, path: string) {
  return base.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
}

function getProxyPath(req: NextRequest, paramsPath: unknown) {
  if (Array.isArray(paramsPath)) return paramsPath.join("/");
  if (typeof paramsPath === "string") return paramsPath;
  return req.nextUrl.pathname.replace(/^\/api\/proxy\/?/, "");
}

/**
 * ✅ บังคับใช้ ENV token เป็นหลัก
 * priority: env -> header -> cookie
 *
 * ถ้าต้องการ "ใช้ env เสมอ" แบบไม่สน header/cookie เลย:
 * - ตั้งค่า FORCE_ENV_TOKEN = true
 */
const FORCE_ENV_TOKEN = true;

function pickToken(req: NextRequest) {
  const envToken = (process.env.API_TOKEN ?? "").trim();

  const headerAuth = req.headers.get("authorization") ?? "";
  const headerToken = headerAuth.toLowerCase().startsWith("bearer ")
    ? headerAuth.slice(7).trim()
    : "";

  const cookieToken = req.cookies.get("access_token")?.value ?? "";

  if (FORCE_ENV_TOKEN && envToken) {
    return { token: envToken, source: "env" as const };
  }

  // ✅ priority: env -> header -> cookie
  const token = envToken || headerToken || cookieToken;

  return {
    token,
    source: envToken ? ("env" as const) : headerToken ? ("header" as const) : cookieToken ? ("cookie" as const) : ("none" as const),
  };
}

async function handler(req: NextRequest, ctx: { params?: { path?: unknown } }) {
  if (!BASE) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_API_BASE_URL" },
      { status: 500 }
    );
  }

  const path = getProxyPath(req, ctx?.params?.path);
  const qs = req.nextUrl.search || "";
  const targetUrl = joinUrl(BASE, path) + qs;

  const headers = new Headers(req.headers);

  // headers ที่ไม่ควรส่ง
  headers.delete("host");
  headers.delete("content-length");

  // ngrok + json
  headers.set("ngrok-skip-browser-warning", "true");
  headers.set("accept", "application/json");

  // ✅ เลือก token
  const { token, source } = pickToken(req);

  // กัน client ส่ง Authorization แปลก ๆ / กัน cookie มาทับ
  headers.delete("authorization");

  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  // ส่ง body เฉพาะ method ที่มี body
  const body =
    req.method === "GET" || req.method === "HEAD"
      ? undefined
      : await req.arrayBuffer();

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
    redirect: "manual",
  });

  const ct = upstream.headers.get("content-type") || "";
  const raw = await upstream.text();

  // ✅ ตอบกลับพร้อม debug header
  return new NextResponse(raw, {
    status: upstream.status,
    headers: {
      "content-type": ct || "application/json",
      "x-proxy-auth-source": source,          // env/header/cookie/none
      "x-proxy-has-auth": token ? "1" : "0",  // 1/0
    },
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
