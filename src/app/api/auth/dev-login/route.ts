import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({
    user: {
      id: "dev-user-1",
      name: "Dev User",
      email: "dev@company.com",
      role: "DEVELOPER",
    },
    mode: "DEV_MOCK_AUTH",
  });

  // 🔑 ใส่ token ปลอม
  res.cookies.set("access_token", "DEV_FAKE_JWT_TOKEN", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  });

  return res;
}
