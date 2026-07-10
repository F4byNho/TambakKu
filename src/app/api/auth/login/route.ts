import { NextResponse } from "next/server";
import { loginSchema } from "@/validators/auth";
import { fetchFromGAS } from "@/lib/gas-client";
import { verifyPassword, setSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const { email, password } = result.data;
    
    // Ambil data user dari Spreadsheet berdasarkan email
    const { data: user, error } = await fetchFromGAS<any>("getUserByEmail", { email });
    
    if (error || !user) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }
    
    // Verifikasi hash password
    const isPasswordValid = verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }
    
    // Set cookie session
    await setSession({
      user_id: user.user_id,
      nama: user.nama,
      email: user.email,
      role: user.role,
    });
    
    return NextResponse.json({
      success: true,
      user: {
        user_id: user.user_id,
        nama: user.nama,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
