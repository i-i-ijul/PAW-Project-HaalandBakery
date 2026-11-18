const db = require("../models");

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
      return res.status(404).json({ error: "Roti ga ketemu" });
    }
    await roti.destroy();
    res.status(200).json({ message: "Roti udah berhasil dihapus" });
  } catch (err) {
    console.error("Error deleting roti: ", err.message);
    res.status(500).json({ error: "Failed to delete roti" });
  }
}

// --- Caption bot AI (hanya untuk penjual) ---
const { groq } = require("../config/groq");

async function captionProduct(req, res) {
  const userId = req.session ? req.session.userId : null;
  if (!userId) {
    return res.status(401).json({ sukses: false, pesan: "Wajib login." });
  }

  const { produk_nama, poin_ciri } = req.body;
  if (!produk_nama) {
    return res.status(400).json({ sukses: false, pesan: "Nama produk wajib diisi." });
  }

  const user = await db.User.findByPk(userId);
  if (!user || user.role !== "penjual") {
    return res.status(403).json({ sukses: false, pesan: "Hanya penjual yang bisa pakai bot caption." });
  }

  const prompt = `Kamu adalah asisten pembuat caption produk untuk toko ${produk_nama || ""}.\nTuliskan 1 caption iklan yang ceria, singkat (2-3 kalimat), dan cocok untuk media sosial (Instagram/TikTok/Shopee).\nTambahkan 2 opsi hashtag relevan.\nProduk: ${produk_nama}${poin_ciri ? " Ciri-ciri: " + poin_ciri : ""}.\nBalas HANYA caption saja, tanpa basa-basi.`;

  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });
    const caption = completion.choices[0]?.message?.content?.trim() || "Gagal menghasilkan caption.";
    res.json({
      sukses: true,
      caption,
    });
  } catch (err) {
    console.error("Caption bot error:", err.message);
    res.status(500).json({ sukses: false, pesan: "Gagal generate caption." });
  }
}

module.exports = {
  getAllRoti,
  getRotiById,
  createRoti,
  updateRoti,
  deleteRoti,
  captionProduct,
  getStatus: (req, res) => {
    res.json({ status: "ok", message: "Server siap" });
  },
};