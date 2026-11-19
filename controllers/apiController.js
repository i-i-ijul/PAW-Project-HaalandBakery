const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const db = require('../models');

async function getAllRoti(req, res) {
  try {
    const roti = await db.Roti.findAll();
    res.status(200).json(roti);
  } catch (err) {
    console.error("Error fetching roti: ", err.message);
    res.status(500).json({ error: "Failed to fetch roti" });
  }
}

async function getRotiById(req, res) {
  const { id } = req.params;
  try {
    const roti = await db.Roti.findByPk(id);
    if (!roti) {
      return res.status(404).json({ error: "roti not found" });
    }
    res.status(200).json(roti);
  } catch (err) {
    console.error("Error fetching roti by ID: ", err.message);
    res.status(500).json({ error: "Failed to fetch roti by ID" });
  }
}

async function createRoti(req, res) {
  const { nama, kategori, deskripsi, harga, stok } = req.body;
  try {
    const newRoti = await db.Roti.create({ nama, kategori, deskripsi, harga, stok });
    res.status(201).json(newRoti);
  } catch (err) {
    console.error("Error creating roti: ", err.message);
    res.status(500).json({ error: "Failed to create roti" });
  }
}

async function updateRoti(req, res) {
  const { id } = req.params;
  const { nama, kategori, deskripsi, harga, stok } = req.body;
  try {
    const roti = await db.Roti.findByPk(id);
    if (!roti) {
      return res.status(404).json({ error: "Roti ga ketemu" });
    }
    roti.nama = nama;
    roti.kategori = kategori;
    roti.deskripsi = deskripsi;
    roti.harga = harga;
    roti.stok = stok;
    await roti.save();
    res.status(200).json(roti);
  } catch (err) {
    console.error("Error updating roti: ", err.message);
    res.status(500).json({ error: "Failed to update roti" });
  }
}

async function deleteRoti(req, res) {
  const { id } = req.params;
  try {
    const roti = await db.Roti.findByPk(id);
    if (!roti) {
      return res.status(404).json({ error: "Roti udah berhasil dihapus" }); // (atau roti not found)
    }
    await roti.destroy();
    res.status(200).json({ message: "Roti udah berhasil dihapus" });
  } catch (err) {
    console.error("Error deleting roti: ", err.message);
    res.status(500).json({ error: "Failed to delete roti" });
  }
}

// FUNGSI BARU UNTUK HANDLE AI CAPTION GENERATOR
async function generateCaption(req, res) {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
    }

    let aiResponse = "";

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "Kamu adalah copywriter profesional untuk toko roti yang ahli membuat caption promosi Instagram/WhatsApp yang menarik, ramah, dan menggunakan emoji yang pas."
          },
          {
            role: "user",
            content: message
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
      });
      aiResponse = chatCompletion.choices[0]?.message?.content;
    } catch (groqErr) {
      console.warn("Groq AI gagal/model deprecated, menggunakan template lokal:", groqErr.message);
      aiResponse = `✨ Promo Spesial Hari Ini! ✨\n\nNikmati kelezatan ${message} buatan kami yang dibuat dengan bahan-bahan pilihan berkualitas tinggi, higienis, dan 100% fresh setiap hari! 🥐🥖\n\nCocok banget untuk menemani waktu santai kamu bareng keluarga atau orang tersayang. Yuk buruan order sebelum kehabisan! 😋🔥\n\n📍 Pesan sekarang dan rasakan nikmatnya di setiap gigitan! #TokoRoti #KulinerEnak #FreshFromTheOven`;
    }

    res.json({ response: aiResponse });
  } catch (err) {
    console.error('Error Caption Controller:', err.message);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
}

module.exports = {
  getAllRoti,
  getRotiById,
  createRoti,
  updateRoti,
  deleteRoti,
  generateCaption, // <-- Jangan lupa diexport agar bisa dipanggil di router
  getStatus: (req, res) => {
    res.json({ status: "ok", message: "Server siap" });
  },
};