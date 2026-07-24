import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";

export async function GET(req: Request) {
  try {
    await destroySession();
    // Redirect to login page with query parameter
    return NextResponse.redirect(new URL("/login?error=account_deleted", req.url));
  } catch (error) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}
