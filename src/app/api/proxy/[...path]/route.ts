import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ""; // https://xxxx.ngrok-free.app/api

function joinUrl(base: string, path: string) {
  return base.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
}

function getProxyPath(req: NextRequest, paramsPath: unknown) {
  // 1) จาก params (กรณี catch-all ทำงานปกติ)
  if (Array.isArray(paramsPath)) return paramsPath.join("/");
  if (typeof paramsPath === "string") return paramsPath;

  // 2) fallback: ดึงจาก URL จริง (กัน params หลุด)
  // /api/proxy/projects -> projects
  const p = req.nextUrl.pathname.replace(/^\/api\/proxy\/?/, "");
  return p;
}

async function handler(req: NextRequest, ctx: { params?: { path?: unknown } }) {
  if (!BASE) {
    return NextResponse.json({ error: "Missing NEXT_PUBLIC_API_BASE_URL" }, { status: 500 });
  }

  const path = getProxyPath(req, ctx?.params?.path);
  const qs = req.nextUrl.search || "";
  const targetUrl = joinUrl(BASE, path) + qs;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("content-length");

  // ✅ ข้าม ngrok warning
  headers.set("ngrok-skip-browser-warning", "true");
  headers.set("Accept", "application/json");

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers,
    body:
      req.method === "GET" || req.method === "HEAD"
        ? undefined
        : await req.arrayBuffer(),
    redirect: "manual",
  });

  const ct = upstream.headers.get("content-type") || "";
  const raw = await upstream.text();

  // ถ้าเป็น HTML = มักเป็น swagger/warning
  if (ct.includes("text/html")) {
    return NextResponse.json(
      {
        error: "Upstream returned HTML (not JSON)",
        targetUrl,
        contentType: ct,
        sample: raw.slice(0, 300),
      },
      { status: 502 }
    );
  }

  // ส่งกลับ JSON (หรือ text) ตามจริง
  return new NextResponse(raw, {
    status: upstream.status,
    headers: { "content-type": ct || "application/json" },
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
