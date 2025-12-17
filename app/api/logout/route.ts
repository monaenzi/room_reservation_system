import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ message: "OK" }, { status: 200 });

  res.cookies.set("auth", "0", { httpOnly: true, path: "/", sameSite: "lax" });
  res.cookies.set("must_change_password", "0", { httpOnly: true, path: "/", sameSite: "lax" });
  res.cookies.set("role", "", { httpOnly: true, path: "/", sameSite: "lax" });

  return res;
}