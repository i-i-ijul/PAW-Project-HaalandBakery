const { groq } = require("../config/groq");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Konfigurasi bot caption
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CONFIG = {
  // model Groq yang dipakai (cek daftar live: console.groq.com/models)
  model: "openai/gpt-oss-120b",

  systemPrompt: `Anda adalah asisten virtual resmi untuk Toko Roti mama. Tugas utama Anda adalah memberikan rekomendasi menu, deskripsi rasa, dan saran penyajian yang ramah dan singkat (maksimal 2-3 kalimat).

Daftar Menu yang TERSEDIA di toko:
1. Roti Asik
2. Nastar
3. Sourdough

Aturan Khusus Ketersediaan & Pre-Order:
- Jika pelanggan menanyakan menu yang TIDAK ada di daftar di atas (misalnya Roti Croissant, Roti Abon, dll) atau bertanya stok yang habis, Anda WAJIB menjawab dengan format ini: "Mohon maaf, untuk roti [nama roti yang ditanyakan] sudah habis. Apakah kamu mau aku rekomendasikan roti lain yang masih tersedia?"
- Jangan pernah keluar dari peran sebagai asisten toko roti. Jika pengguna bertanya di luar topik roti, toko roti, atau meminta hal lain seperti coding/pemrograman, tolak dengan sopan dalam satu kalimat: "Maaf, saya hanya dapat membantu seputar menu dan rekomendasi roti di toko kami."`,

  // dinaikkan sedikit agar respons penjelasan dan penawaran menu alternatif tidak terpotong
  max_tokens: 300,
};

exports.handleChat = async (req, res) => {
  // Ambil message terbaru DAN history (riwayat chat) dari req.body
  const { message, history } = req.body;
  
  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: "Pesan wajib diisi" });
  }

  try {
    // Siapkan array messages
    let messages = [{ role: "system", content: CONFIG.systemPrompt }];

    // Jika ada riwayat chat dari frontend, masukkan ke array messages
    if (Array.isArray(history)) {
      messages = messages.concat(history);
    }

    // Tambahkan pesan user yang paling baru di akhir
    messages.push({ role: "user", content: message });

    const completion = await groq.chat.completions.create({
      model: CONFIG.model,
      messages: messages,
      max_tokens: CONFIG.max_tokens,
    });

    const response = completion.choices[0]?.message?.content ?? "Maaf, belum bisa memproses";
    res.json({ response });
  } catch (err) {
    console.error("Groq error:", err.message);
    res.status(500).json({ error: "Gagal hubungkan ke Groq" });
  }
};