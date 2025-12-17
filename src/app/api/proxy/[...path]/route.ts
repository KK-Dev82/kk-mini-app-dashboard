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
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_API_BASE_URL" },
      { status: 500 }
    );
  }

  const path = getProxyPath(req, ctx?.params?.path);
  const qs = req.nextUrl.search || "";
  const targetUrl = joinUrl(BASE, path) + qs;

  // ---- headers ----
  const headers = new Headers(req.headers);

  // ล้าง header ที่ไม่ควรส่งไป upstream
  headers.delete("host");
  headers.delete("content-length");

  // ✅ ข้าม ngrok warning
  headers.set("ngrok-skip-browser-warning", "true");
  headers.set("Accept", "application/json");

  // ✅ สำคัญ: อ่าน token จาก HttpOnly cookie แล้วแนบ Authorization ให้ upstream
  // - ใน NextRequest คุณอ่าน cookie ได้แบบนี้
  const token = req.cookies.get("access_token")?.value;

  // กัน client ส่ง Authorization แปลก ๆ มาเอง
  headers.delete("authorization");

  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  // ---- body ----
  const body =
    req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer();

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
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
  // NOTE: คง content-type เดิมไว้
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
