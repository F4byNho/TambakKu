import { NextResponse } from "next/server";
import { registerSchema } from "@/validators/auth";
import { postToGAS } from "@/lib/gas-client";
import { hashPassword, setSession } from "@/lib/session";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const { nama, email, password, nomor_hp, alamat } = result.data;
    
    const userId = crypto.randomUUID();
    const hashedPassword = hashPassword(password);
    const date = new Date().toISOString();
    
    const payload = {
      user_id: userId,
      nama,
      email,
      password: hashedPassword,
      nomor_hp,
      alamat,
      role: "user",
      tanggal_daftar: date,
    };
    
    const res = await postToGAS("createUser", payload);
    
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    
    // Otomatis buat session setelah register berhasil
    await setSession(payload);
    
    return NextResponse.json({ 
      success: true, 
      user: { user_id: userId, nama, email, role: "user" } 
    });
  } catch (error: any) {
    console.error("Register API Error:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
