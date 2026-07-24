/**
 * Mengambil data dari Google Apps Script menggunakan metode GET
 */
export async function fetchFromGAS<T = any>(
  action: string,
  params: Record<string, string> = {}
): Promise<{ data: T | null; error?: string }> {
  try {
    const GAS_WEB_APP_URL = process.env.GAS_WEB_APP_URL;
    const GAS_API_KEY = process.env.GAS_API_KEY;

    if (!GAS_WEB_APP_URL) {
      throw new Error("GAS_WEB_APP_URL belum dikonfigurasi di berkas env");
    }

    const url = new URL(GAS_WEB_APP_URL);
    url.searchParams.set("action", action);
    url.searchParams.set("apiKey", GAS_API_KEY || "");
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    }

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      // Menonaktifkan caching bawaan Next.js untuk mendapatkan data real-time dari Spreadsheet
      cache: "no-store",
    });

    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch (e) {
      throw new Error(`Respon GAS bukan format JSON valid: ${text.substring(0, 120)}`);
    }

    if (json.error) {
      return { data: null, error: json.error };
    }
    return { data: json.data };
  } catch (error: any) {
    console.error("Fungsi fetchFromGAS bermasalah:", error);
    return { data: null, error: error.message || "Gagal menghubungi API Google Apps Script" };
  }
}

/**
 * Mengirim data ke Google Apps Script menggunakan metode POST (Create, Update, Delete)
 */
export async function postToGAS<T = any>(
  action: string,
  data: any
): Promise<{ success?: boolean; message?: string; error?: string; [key: string]: any }> {
  try {
    const GAS_WEB_APP_URL = process.env.GAS_WEB_APP_URL;
    const GAS_API_KEY = process.env.GAS_API_KEY;

    if (!GAS_WEB_APP_URL) {
      throw new Error("GAS_WEB_APP_URL belum dikonfigurasi di berkas env");
    }

    const payload = {
      action,
      apiKey: GAS_API_KEY,
      data,
    };

    const res = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch (e) {
      throw new Error(`Respon GAS bukan format JSON valid: ${text.substring(0, 120)}`);
    }

    if (!res.ok) {
      throw new Error(json.error || `Kesalahan post GAS: ${res.statusText} (${res.status})`);
    }

    return json;
  } catch (error: any) {
    console.error("Fungsi postToGAS bermasalah:", error);
    return { error: error.message || "Gagal mengirim data ke API Google Apps Script" };
  }
}
