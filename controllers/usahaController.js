/**
 * Controller profil usaha (penjual).
 *
 * - create: penjual membuat/ memperbarui profil tokonya (1:1 dengan user).
 * - get: ambil profil usaha milik user yang login.
 */

const db = require("../models");

async function createUsaha(req, res) {
  const userId = req.session ? req.session.userId : null;
  if (!userId) {
    return res.status(401).json({ sukses: false, pesan: "Wajib login." });
  }

  // Pastikan yang login adalah penjual
  const user = await db.User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ sukses: false, pesan: "Pengguna tidak ditemukan." });
  }
  if (user.role !== "penjual") {
    return res.status(403).json({ sukses: false, pesan: "Hanya penjual yang bisa membuat profil usaha." });
  }

  const { nama_toko, nomor_telepon, alamat_toko } = req.body;

  if (!nama_toko || !nomor_telepon || !alamat_toko) {
    return res.status(400).json({
      sukses: false,
      pesan: "Nama toko, nomor telepon, dan alamat toko wajib diisi.",
    });
  }

  try {
    // Cek apakah sudah ada profil usaha
    let usaha = await db.Usaha.findOne({ where: { user_id: userId } });
    if (usaha) {
      usaha.nama_toko = nama_toko;
      usaha.nomor_telepon = nomor_telepon;
      usaha.alamat_toko = alamat_toko;
      await usaha.save();
    } else {
      usaha = await db.Usaha.create({
        user_id: userId,
        nama_toko,
        nomor_telepon,
        alamat_toko,
      });
    }

    // Sync session usahaId
    if (req.session) {
      req.session.usahaId = usaha.id;
      req.session.save();
    }

    res.status(201).json({
      sukses: true,
      pesan: "Profil usaha berhasil disimpan.",
      data: {
        id: usaha.id,
        nama_toko: usaha.nama_toko,
        nomor_telepon: usaha.nomor_telepon,
        alamat_toko: usaha.alamat_toko,
      },
    });
  } catch (err) {
    console.error("Create usaha error:", err.message);
    res.status(500).json({ sukses: false, pesan: "Gagal menyimpan profil usaha." });
  }
}

async function getUsaha(req, res) {
  const userId = req.session ? req.session.userId : null;
  if (!userId) {
    return res.status(401).json({ sukses: false, pesan: "Wajib login." });
  }

  try {
    const usaha = await db.Usaha.findOne({ where: { user_id: userId } });
    if (!usaha) {
      return res.status(404).json({
        sukses: false,
        pesan: "Profil usaha belum dibuat.",
        data: null,
      });
    }

    res.json({
      sukses: true,
      data: {
        id: usaha.id,
        user_id: usaha.user_id,
        nama_toko: usaha.nama_toko,
        nomor_telepon: usaha.nomor_telepon,
        alamat_toko: usaha.alamat_toko,
      },
    });
  } catch (err) {
    console.error("Get usaha error:", err.message);
    res.status(500).json({ sukses: false, pesan: "Gagal mengambil profil usaha." });
  }
}

async function updateUsaha(req, res) {
  const userId = req.session ? req.session.userId : null;
  if (!userId) {
    return res.status(401).json({ sukses: false, pesan: "Wajib login." });
  }

  const user = await db.User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ sukses: false, pesan: "Pengguna tidak ditemukan." });
  }
  if (user.role !== "penjual") {
    return res.status(403).json({ sukses: false, pesan: "Hanya penjual yang bisa mengedit profil usaha." });
  }

  const { nama_toko, nomor_telepon, alamat_toko } = req.body;

  if (!nama_toko && !nomor_telepon && !alamat_toko) {
    return res.status(400).json({
      sukses: false,
      pesan: "Minimal satu field yang diisi.",
    });
  }

  try {
    const usaha = await db.Usaha.findOne({ where: { user_id: userId } });
    if (!usaha) {
      return res.status(404).json({ sukses: false, pesan: "Profil usaha belum ada." });
    }

    if (nama_toko !== undefined) usaha.nama_toko = nama_toko;
    if (nomor_telepon !== undefined) usaha.nomor_telepon = nomor_telepon;
    if (alamat_toko !== undefined) usaha.alamat_toko = alamat_toko;
    await usaha.save();

    res.json({
      sukses: true,
      pesan: "Profil usaha berhasil diperbarui.",
      data: {
        id: usaha.id,
        nama_toko: usaha.nama_toko,
        nomor_telepon: usaha.nomor_telepon,
        alamat_toko: usaha.alamat_toko,
      },
    });
  } catch (err) {
    console.error("Update usaha error:", err.message);
    res.status(500).json({ sukses: false, pesan: "Gagal memperbarui profil usaha." });
  }
}

// Daftar toko (penjual) — publik, tanpa login
async function listUsaha(req, res) {
  try {
    const usahas = await db.Usaha.findAll({
      include: [{ model: db.User, as: "user", attributes: ["id", "nama", "email"] }],
    });

    const data = usahas.map((u) => ({
      id: u.id,
      user_id: u.user_id,
      user: {
        id: u.user.id,
        nama: u.user.nama,
        email: u.user.email,
      },
      nama_toko: u.nama_toko,
      nomor_telepon: u.nomor_telepon,
      alamat_toko: u.alamat_toko,
    }));

    res.json({ sukses: true, data });
  } catch (err) {
    console.error("List usaha error:", err.message);
    res.status(500).json({ sukses: false, pesan: "Gagal mengambil daftar toko." });
  }
}

module.exports = { createUsaha, getUsaha, updateUsaha, listUsaha };
