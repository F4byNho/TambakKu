import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Helper base64url decode yang aman untuk Edge Runtime
function base64urlDecode(base64url: string): string {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// Memverifikasi tanda tangan HMAC-SHA256 (Web Crypto) untuk Edge Runtime
async function verify(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const data = encoder.encode(payload);
  
  // Konversi signature base64url ke Uint8Array
  let base64 = signature.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const sigData = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    sigData[i] = binary.charCodeAt(i);
  }
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  
  return await crypto.subtle.verify("HMAC", cryptoKey, sigData, data);
}

export async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("tambakku_session");
  const { pathname } = request.nextUrl;
  
  let user = null;
  
  if (sessionCookie) {
    try {
      const token = sessionCookie.value;
      const [base64Payload, signature] = token.split(".");
      const JWT_SECRET = process.env.JWT_SECRET || "TambakKu_JWT_Secret_Key_Super_Secure_2026";
      
      const isValid = await verify(base64Payload, signature, JWT_SECRET);
      if (isValid) {
        user = JSON.parse(base64urlDecode(base64Payload));
      }
    } catch (e) {
      // Abaikan jika terjadi error parsing atau tanda tangan tidak sah
    }
  }
  
  // Halaman yang wajib login (Protected)
  const isProtectedPath = 
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/tambak") ||
    pathname.startsWith("/siklus") ||
    pathname.startsWith("/pembukuan") ||
    pathname.startsWith("/laporan");
    
  // Halaman tamu (Guest)
  const isGuestPath = 
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/";
    
  if (isProtectedPath && !user) {
    // Jika mencoba akses halaman berbayar/terkunci tapi belum login, arahkan ke login
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  if (isGuestPath && user) {
    // Jika sudah login tapi mencoba ke halaman tamu (login/register), arahkan ke dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  return NextResponse.next();
}

// Menentukan rute mana saja yang akan diproses middleware ini
export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/dashboard/:path*",
    "/tambak/:path*",
    "/siklus/:path*",
    "/pembukuan/:path*",
    "/laporan/:path*",
  ],
};
