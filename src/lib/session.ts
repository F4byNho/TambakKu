import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_COOKIE_NAME = "tambakku_session";
const JWT_SECRET = process.env.JWT_SECRET || "TambakKu_JWT_Secret_Key_Super_Secure_2026";

// Hash password menggunakan PBKDF2 + salt statis (dijalankan di runtime Node.js)
export function hashPassword(password: string): string {
  const salt = "tambakku_salt_kkn_2026";
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash;
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Helper base64url untuk kompatibilitas Edge Runtime tanpa ketergantungan Buffer
function base64urlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

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

function arrayBufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlToArrayBuffer(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Menandatangani token menggunakan HMAC-SHA256 (Web Crypto)
async function sign(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const data = encoder.encode(payload);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
  return arrayBufferToBase64url(signature);
}

// Memverifikasi tanda tangan HMAC-SHA256 (Web Crypto)
async function verify(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const data = encoder.encode(payload);
  const sigData = base64urlToArrayBuffer(signature);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  
  return await crypto.subtle.verify("HMAC", cryptoKey, sigData, data);
}

// Membuat token session yang ditandatangani
export async function encrypt(payload: string): Promise<string> {
  const base64Payload = base64urlEncode(payload);
  const signature = await sign(base64Payload, JWT_SECRET);
  return `${base64Payload}.${signature}`;
}

// Memvalidasi dan mendekripsi token session
export async function decrypt(token: string): Promise<string | null> {
  try {
    const [base64Payload, signature] = token.split(".");
    if (!base64Payload || !signature) return null;
    
    const isValid = await verify(base64Payload, signature, JWT_SECRET);
    if (!isValid) return null;
    
    return base64urlDecode(base64Payload);
  } catch {
    return null;
  }
}

// Model data session user
export interface SessionUser {
  userId: string;
  nama: string;
  email: string;
  role: string;
}

// Ambil session aktif dari Cookie
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie) return null;
    
    const decrypted = await decrypt(sessionCookie.value);
    if (!decrypted) return null;
    
    return JSON.parse(decrypted) as SessionUser;
  } catch (e) {
    return null;
  }
}

// Simpan session baru ke Cookie
export async function setSession(user: { user_id: string; nama: string; email: string; role: string }) {
  const cookieStore = await cookies();
  const sessionData = JSON.stringify({
    userId: user.user_id,
    nama: user.nama,
    email: user.email,
    role: user.role,
  });
  
  const encrypted = await encrypt(sessionData);
  
  cookieStore.set(SESSION_COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 Hari
  });
}

// Hapus session (Logout)
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
