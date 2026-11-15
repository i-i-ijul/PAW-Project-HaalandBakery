const { groq } = require("../config/groq");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Konfigurasi bot caption
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CONFIG = {
  // model Groq yang dipakai (cek daftar live: console.groq.com/models)
  model: "openai/gpt-oss-120b",

  systemPrompt:
    "Anda adalah asisten virtual resmi untuk Toko Roti. Tugas Anda hanya memberikan rekomendasi menu, deskripsi rasa, saran penyajian (seperti pasangan minuman), dan informasi seputar produk roti secara ramah dan singkat (maksimal 2-3 kalimat). Jangan pernah keluar dari peran ini. Jika pengguna bertanya di luar topik roti, toko roti, atau meminta hal lain seperti pemrograman/coding, tolak dengan sopan dalam satu kalimat: 'Maaf, saya hanya dapat membantu seputar menu dan rekomendasi roti di toko kami.'",

  // sedikit dinaikkan agar kalimat rekomendasi tidak terpotong di tengah
  max_tokens: 200,
};

exports.handleChat = async (req, res) => {
  const { message } = req.body;
  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: "Pesan wajib diisi" });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: CONFIG.model,
      messages: [
        { role: "system", content: CONFIG.systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: CONFIG.max_tokens,
    });

    const response = completion.choices[0]?.message?.content ?? "Maaf, belum bisa memproses";
    res.json({ response });
  } catch (err) {
    console.error("Groq error:", err.message);
    res.status(500).json({ error: "Gagal hubungkan ke Groq" });
  }
};