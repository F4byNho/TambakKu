/**
 * TambakKu - Google Apps Script Backend Controller
 * 
 * Petunjuk Penggunaan:
 * 1. Buat Google Spreadsheet baru.
 * 2. Buka "Ekstensi" > "Apps Script".
 * 3. Hapus kode bawaan dan tempel kode ini ke dalam file `Kode.gs`.
 * 4. Ganti nilai `SECRET_API_KEY` di bawah dengan kunci acak pilihan Anda (samakan dengan di berkas .env.local).
 * 5. Klik "Terapkan" > "Penerapan Baru" (Deploy > New Deployment).
 * 6. Pilih jenis "Aplikasi Web" (Web App).
 * 7. Setel "Yang memiliki akses" menjadi "Siapa saja" (Anyone).
 * 8. Klik "Terapkan" (Deploy), berikan izin akses spreadsheet, lalu salin URL Aplikasi Web yang diberikan.
 */

const SECRET_API_KEY = "TambakKu_Secure_API_Key_2026"; // Silakan ganti untuk keamanan ekstra

// Helper untuk mengembalikan respon JSON
function jsonResponse(data, status = 200) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Inisialisasi Sheet dan Header jika belum ada
function initDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const tables = {
    "Users": ["user_id", "nama", "email", "password", "nomor_hp", "alamat", "role", "tanggal_daftar"],
    "Tambak": ["tambak_id", "user_id", "nama_tambak", "lokasi", "luas_tambak", "keterangan"],
    "Siklus": ["siklus_id", "tambak_id", "user_id", "nomor_siklus", "tanggal_mulai", "tanggal_selesai", "status"],
    "Penebaran Benur": ["benur_id", "siklus_id", "user_id", "tanggal_tebar", "jenis_udang", "ukuran_PL", "jumlah_benur", "harga_per_ekor", "total_harga"],
    "Operasional": ["operasional_id", "siklus_id", "user_id", "tanggal", "kategori", "nominal", "keterangan"],
    "Sampling": ["sampling_id", "siklus_id", "user_id", "tanggal_sampling", "jumlah_udang_sampling", "berat_total_sampling", "abw", "size"],
    "Panen": ["panen_id", "siklus_id", "user_id", "tanggal_panen", "berat_panen", "harga_jual", "pendapatan"]
  };

  for (const sheetName in tables) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(tables[sheetName]);
      // Format header row (bold, background color)
      sheet.getRange(1, 1, 1, tables[sheetName].length)
        .setFontWeight("bold")
        .setBackground("#e2e8f0")
        .setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
  }
}

// Fungsi pembantu untuk membaca seluruh baris sebagai JSON Object array
function readSheetData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  
  return values.map((row) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

// Menemukan baris berdasarkan ID
function findRowIndexById(sheet, idColumnName, idValue) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colIndex = headers.indexOf(idColumnName) + 1;
  if (colIndex === 0) return -1;
  
  const values = sheet.getRange(2, colIndex, lastRow - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(idValue)) {
      return i + 2; // Mengembalikan indeks baris spreadsheet (1-indexed, baris 1 header)
    }
  }
  return -1;
}

// --- CONTROLLER GET ---
function doGet(e) {
  initDatabase(); // Pastikan database siap
  
  const params = e.parameter;
  const action = params.action;
  const apiKey = params.apiKey;
  
  // Validasi API Key
  if (apiKey !== SECRET_API_KEY) {
    return jsonResponse({ error: "Unauthorized. Invalid API Key." }, 401);
  }
  
  try {
    switch (action) {
      case "getUserByEmail":
        const users = readSheetData("Users");
        const user = users.find(u => u.email === params.email);
        return jsonResponse({ data: user || null });
        
      case "getTambak":
        const tambaks = readSheetData("Tambak");
        const filteredTambak = tambaks.filter(t => t.user_id === params.userId || params.isAdmin === "true");
        return jsonResponse({ data: filteredTambak });
        
      case "getSiklus":
        const allSiklus = readSheetData("Siklus");
        const filteredSiklus = allSiklus.filter(s => {
          const matchUser = s.user_id === params.userId || params.isAdmin === "true";
          const matchTambak = params.tambakId ? s.tambak_id === params.tambakId : true;
          return matchUser && matchTambak;
        });
        return jsonResponse({ data: filteredSiklus });
        
      case "getBenur":
        const benurs = readSheetData("Penebaran Benur");
        const filteredBenur = benurs.filter(b => b.siklus_id === params.siklusId);
        return jsonResponse({ data: filteredBenur });
        
      case "getOperasional":
        const op = readSheetData("Operasional");
        const filteredOp = op.filter(o => o.siklus_id === params.siklusId);
        return jsonResponse({ data: filteredOp });
        
      case "getSampling":
        const sampling = readSheetData("Sampling");
        const filteredSampling = sampling.filter(s => s.siklus_id === params.siklusId);
        return jsonResponse({ data: filteredSampling });
        
      case "getPanen":
        const panen = readSheetData("Panen");
        const filteredPanen = panen.filter(p => p.siklus_id === params.siklusId);
        return jsonResponse({ data: filteredPanen });
        
      case "getLaporanData":
        return getLaporanDataset(params.userId, params.tambakId, params.siklusId);

      case "getDashboardData":
        return getDashboardDataset(params.userId);
        
      default:
        return jsonResponse({ error: "Unknown action: " + action }, 400);
    }
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

// --- CONTROLLER POST ---
function doPost(e) {
  initDatabase();
  
  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ error: "Invalid JSON format" }, 400);
  }
  
  const action = payload.action;
  const apiKey = payload.apiKey;
  const data = payload.data;
  
  if (apiKey !== SECRET_API_KEY) {
    return jsonResponse({ error: "Unauthorized. Invalid API Key." }, 401);
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    switch (action) {
      case "createUser":
        const userSheet = ss.getSheetByName("Users");
        const existingUsers = readSheetData("Users");
        if (existingUsers.some(u => u.email === data.email)) {
          return jsonResponse({ error: "Email sudah terdaftar" }, 400);
        }
        userSheet.appendRow([
          data.user_id,
          data.nama,
          data.email,
          data.password,
          data.nomor_hp,
          data.alamat,
          data.role || "user",
          data.tanggal_daftar
        ]);
        return jsonResponse({ success: true, message: "User berhasil dibuat" });
        
      case "createTambak":
        const tambakSheet = ss.getSheetByName("Tambak");
        tambakSheet.appendRow([
          data.tambak_id,
          data.user_id,
          data.nama_tambak,
          data.lokasi,
          Number(data.luas_tambak),
          data.keterangan || ""
        ]);
        return jsonResponse({ success: true, message: "Tambak berhasil dibuat" });
        
      case "updateTambak":
        return updateRowData("Tambak", "tambak_id", data.tambak_id, data);
        
      case "deleteTambak":
        return deleteRowData("Tambak", "tambak_id", data.tambak_id);
        
      case "createSiklus":
        const siklusSheet = ss.getSheetByName("Siklus");
        siklusSheet.appendRow([
          data.siklus_id,
          data.tambak_id,
          data.user_id,
          Number(data.nomor_siklus),
          data.tanggal_mulai,
          "", // tanggal_selesai kosong saat dibuat
          "aktif" // status awal aktif
        ]);
        return jsonResponse({ success: true, message: "Siklus berhasil dimulai" });
        
      case "updateSiklus":
        return updateRowData("Siklus", "siklus_id", data.siklus_id, data);
        
      case "deleteSiklus":
        return deleteRowData("Siklus", "siklus_id", data.siklus_id);
        
      case "createBenur":
        const benurSheet = ss.getSheetByName("Penebaran Benur");
        const totalHargaBenur = Number(data.jumlah_benur) * Number(data.harga_per_ekor);
        benurSheet.appendRow([
          data.benur_id,
          data.siklus_id,
          data.user_id,
          data.tanggal_tebar,
          data.jenis_udang,
          data.ukuran_PL,
          Number(data.jumlah_benur),
          Number(data.harga_per_ekor),
          totalHargaBenur
        ]);
        return jsonResponse({ success: true, message: "Penebaran Benur berhasil dicatat", total_harga: totalHargaBenur });
        
      case "updateBenur":
        data.total_harga = Number(data.jumlah_benur) * Number(data.harga_per_ekor);
        return updateRowData("Penebaran Benur", "benur_id", data.benur_id, data);
        
      case "deleteBenur":
        return deleteRowData("Penebaran Benur", "benur_id", data.benur_id);
        
      case "createOperasional":
        const opSheet = ss.getSheetByName("Operasional");
        opSheet.appendRow([
          data.operasional_id,
          data.siklus_id,
          data.user_id,
          data.tanggal,
          data.kategori,
          Number(data.nominal),
          data.keterangan || ""
        ]);
        return jsonResponse({ success: true, message: "Biaya operasional berhasil dicatat" });
        
      case "updateOperasional":
        return updateRowData("Operasional", "operasional_id", data.operasional_id, data);
        
      case "deleteOperasional":
        return deleteRowData("Operasional", "operasional_id", data.operasional_id);
        
      case "createSampling":
        const samplingSheet = ss.getSheetByName("Sampling");
        const abw = Number(data.berat_total_sampling) / Number(data.jumlah_udang_sampling);
        const size = 1000 / abw;
        samplingSheet.appendRow([
          data.sampling_id,
          data.siklus_id,
          data.user_id,
          data.tanggal_sampling,
          Number(data.jumlah_udang_sampling),
          Number(data.berat_total_sampling),
          abw,
          size
        ]);
        return jsonResponse({ success: true, message: "Sampling berhasil dicatat", abw, size });
        
      case "updateSampling":
        const uAbw = Number(data.berat_total_sampling) / Number(data.jumlah_udang_sampling);
        data.abw = uAbw;
        data.size = 1000 / uAbw;
        return updateRowData("Sampling", "sampling_id", data.sampling_id, data);
        
      case "deleteSampling":
        return deleteRowData("Sampling", "sampling_id", data.sampling_id);
        
      case "createPanen":
        const panenSheet = ss.getSheetByName("Panen");
        const pendapatan = Number(data.berat_panen) * Number(data.harga_jual);
        panenSheet.appendRow([
          data.panen_id,
          data.siklus_id,
          data.user_id,
          data.tanggal_panen,
          Number(data.berat_panen),
          Number(data.harga_jual),
          pendapatan
        ]);
        return jsonResponse({ success: true, message: "Data panen berhasil dicatat", pendapatan });
        
      case "updatePanen":
        data.pendapatan = Number(data.berat_panen) * Number(data.harga_jual);
        return updateRowData("Panen", "panen_id", data.panen_id, data);
        
      case "deletePanen":
        return deleteRowData("Panen", "panen_id", data.panen_id);
        
      default:
        return jsonResponse({ error: "Unknown action: " + action }, 400);
    }
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

// Helper untuk memperbarui baris data
function updateRowData(sheetName, idColumnName, idValue, updateData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const rowIndex = findRowIndexById(sheet, idColumnName, idValue);
  
  if (rowIndex === -1) {
    return jsonResponse({ error: "Data tidak ditemukan" }, 404);
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  for (const key in updateData) {
    const colIndex = headers.indexOf(key) + 1;
    if (colIndex > 0) {
      sheet.getRange(rowIndex, colIndex).setValue(updateData[key]);
    }
  }
  
  return jsonResponse({ success: true, message: "Data berhasil diperbarui" });
}

// Helper untuk menghapus baris data
function deleteRowData(sheetName, idColumnName, idValue) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const rowIndex = findRowIndexById(sheet, idColumnName, idValue);
  
  if (rowIndex === -1) {
    return jsonResponse({ error: "Data tidak ditemukan" }, 404);
  }
  
  sheet.deleteRow(rowIndex);
  return jsonResponse({ success: true, message: "Data berhasil dihapus" });
}

// Agregasi Data Dashboard
function getDashboardDataset(userId) {
  const tambaks = readSheetData("Tambak").filter(t => t.user_id === userId);
  const siklus = readSheetData("Siklus").filter(s => s.user_id === userId);
  const benurs = readSheetData("Penebaran Benur").filter(b => b.user_id === userId);
  const ops = readSheetData("Operasional").filter(o => o.user_id === userId);
  const samplings = readSheetData("Sampling").filter(s => s.user_id === userId);
  const panens = readSheetData("Panen").filter(p => p.user_id === userId);
  
  const activeSiklus = siklus.filter(s => s.status === "aktif");
  
  // Total Modal = Benur + Operasional
  const totalBenurCost = benurs.reduce((acc, curr) => acc + Number(curr.total_harga || 0), 0);
  const totalOpCost = ops.reduce((acc, curr) => acc + Number(curr.nominal || 0), 0);
  const totalModal = totalBenurCost + totalOpCost;
  
  // Total Pendapatan
  const totalRevenue = panens.reduce((acc, curr) => acc + Number(curr.pendapatan || 0), 0);
  const totalLaba = totalRevenue - totalModal;
  
  // Total Panen (kg)
  const totalHarvestWeight = panens.reduce((acc, curr) => acc + Number(curr.berat_panen || 0), 0);
  
  // Sampling Terakhir
  let lastAbw = 0;
  let lastSize = 0;
  if (samplings.length > 0) {
    // Sort by date descending
    samplings.sort((a, b) => new Date(b.tanggal_sampling) - new Date(a.tanggal_sampling));
    lastAbw = Number(samplings[0].abw || 0);
    lastSize = Number(samplings[0].size || 0);
  }
  
  return jsonResponse({
    data: {
      metrics: {
        totalTambak: tambaks.length,
        activeSiklus: activeSiklus.length,
        totalModal,
        totalRevenue,
        totalLaba,
        totalHarvestWeight,
        lastAbw,
        lastSize
      },
      // Data untuk chart
      cyclesSummary: siklus.map(s => {
        const cBenur = benurs.filter(b => b.siklus_id === s.siklus_id).reduce((acc, c) => acc + Number(c.total_harga || 0), 0);
        const cOp = ops.filter(o => o.siklus_id === s.siklus_id).reduce((acc, c) => acc + Number(c.nominal || 0), 0);
        const cPanen = panens.filter(p => p.siklus_id === s.siklus_id).reduce((acc, c) => acc + Number(c.pendapatan || 0), 0);
        const tName = tambaks.find(t => t.tambak_id === s.tambak_id)?.nama_tambak || "Kolam";
        return {
          siklus_id: s.siklus_id,
          nama_tambak: tName,
          nomor_siklus: s.nomor_siklus,
          modal: cBenur + cOp,
          pendapatan: cPanen,
          laba: cPanen - (cBenur + cOp),
          status: s.status
        };
      })
    }
  });
}

// Ambil Seluruh Data Relasional untuk Laporan
function getLaporanDataset(userId, tambakId, siklusId) {
  const tambaks = readSheetData("Tambak").filter(t => t.user_id === userId);
  const allSiklus = readSheetData("Siklus").filter(s => s.user_id === userId);
  
  // Filter berdasarkan tambak dan siklus jika didefinisikan
  const filteredSiklus = allSiklus.filter(s => {
    const matchTambak = tambakId ? s.tambak_id === tambakId : true;
    const matchSiklus = siklusId ? s.siklus_id === siklusId : true;
    return matchTambak && matchSiklus;
  });
  
  const siklusIds = filteredSiklus.map(s => s.siklus_id);
  
  const benurs = readSheetData("Penebaran Benur").filter(b => siklusIds.includes(b.siklus_id));
  const ops = readSheetData("Operasional").filter(o => siklusIds.includes(o.siklus_id));
  const samplings = readSheetData("Sampling").filter(s => siklusIds.includes(s.siklus_id));
  const panens = readSheetData("Panen").filter(p => siklusIds.includes(p.siklus_id));
  
  return jsonResponse({
    data: {
      tambaks: tambaks.filter(t => !tambakId || t.tambak_id === tambakId),
      siklus: filteredSiklus,
      benur: benurs,
      operasional: ops,
      sampling: samplings,
      panen: panens
    }
  });
}
