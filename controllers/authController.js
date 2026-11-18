/**
 * Controller auth: register, login, logout, current user, update profile.
 *
 * Password di-hash pakai scrypt (built-in crypto), tanpa tambah dependency.
 */

const crypto = require("crypto");
const db = require("../models");

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

function hashPassword(plain) {
  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  const derived = crypto.scryptSync(plain, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(plain, stored) {
  const [salt, expected] = String(stored).split(":");
  if (!salt || !expected) return false;
  const derived = crypto.scryptSync(plain, salt, KEY_LENGTH).toString("hex");
  return derived === expected;
}

async function register(req, res) {
  const { nama, email, password, role } = req.body;

  if (!nama || !email || !password) {
    return res.status(400).json({
      sukses: false,
      pesan: "Nama, email, dan password wajib diisi.",
    });
  }

  if (!["penjual", "pembeli"].includes(role)) {
    return res.status(400).json({
      sukses: false,
      pesan: "Role tidak valid. Gunakan 'penjual' atau 'pembeli'.",
    });
  }

  // Validasi email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ sukses: false, pesan: "Format email tidak valid." });
  }

  try {
    const existing = await db.User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ sukses: false, pesan: "Email sudah terdaftar." });
    }

    const hashed = hashPassword(password);

    const user = await db.User.create({
      nama,
      email,
      password: hashed,
      role,
    });

    // Buat session otomatis (express-session sudah menyimpan cookie)
    req.session.regenerate((err) => {
      if (err) {
        console.error("Regenerate session error:", err.message);
        return res.status(500).json({ sukses: false, pesan: "Gagal membuat sesi." });
      }
      req.session.userId = user.id;
      req.session.role = user.role;
      req.session.nama = user.nama;
      req.session.usahaId = null; // diisi nanti saat profil usaha dibuat
      req.session.save();

      return res.status(201).json({
        sukses: true,
        pesan: "Pendaftaran berhasil, silakan login.",
        data: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          role: user.role,
        },
      });
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ sukses: false, pesan: "Gagal mendaftar." });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ sukses: false, pesan: "Email dan password wajib diisi." });
  }

  try {
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ sukses: false, pesan: "Email atau password salah." });
    }

    const valid = verifyPassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ sukses: false, pesan: "Email atau password salah." });
    }

    req.session.regenerate((err) => {
      if (err) {
        console.error("Regenerate session error:", err.message);
        return res.status(500).json({ sukses: false, pesan: "Gagal membuat sesi." });
      }
      req.session.userId = user.id;
      req.session.role = user.role;
      req.session.nama = user.nama;
      req.session.usahaId = user.usahaId ? user.usahaId : null;
      req.session.save();

      return res.json({
        sukses: true,
        pesan: "Login berhasil.",
        data: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          role: user.role,
          usahaId: req.session.usahaId,
        },
      });
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ sukses: false, pesan: "Gagal login." });
  }
}

async function logout(req, res) {
  return new Promise((resolve) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout session error:", err.message);
      }
      req.session = null;
      resolve();
    });
  }).then(() => {
    res.json({ sukses: true, pesan: "Logout berhasil." });
  });
}

async function getCurrentUser(req, res) {
  const userId = req.session ? req.session.userId : null;
  if (!userId) {
    return res.status(401).json({ sukses: false, pesan: "Belum login." });
  }

  try {
    const user = await db.User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ sukses: false, pesan: "Pengguna tidak ditemukan." });
    }

    const usaha = user.usaha
      ? {
          id: user.usaha.id,
          nama_toko: user.usaha.nama_toko,
          nomor_telepon: user.usaha.nomor_telepon,
          alamat_toko: user.usaha.alamat_toko,
        }
      : null;

    res.json({
      sukses: true,
      data: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        usaha,
        loggedInAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Get current user error:", err.message);
    res.status(500).json({ sukses: false, pesan: "Gagal mengambil data pengguna." });
  }
}

async function updateProfile(req, res) {
  const userId = req.session ? req.session.userId : null;
  if (!userId) {
    return res.status(401).json({ sukses: false, pesan: "Wajib login." });
  }

  const { nama, email, password, foto_profile } = req.body;

  try {
    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ sukses: false, pesan: "Pengguna tidak ditemukan." });
    }

    if (nama !== undefined) user.nama = nama;
    if (email !== undefined) {
      // Cek duplikat email kecuali milik user ini
      const existing = await db.User.findOne({
        where: { email, id: { [db.Sequelize.Op.ne]: userId } },
      });
      if (existing) {
        return res.status(409).json({ sukses: false, pesan: "Email sudah terdaftar." });
      }
      user.email = email;
    }
    if (password !== undefined) {
      if (!password) {
        return res.status(400).json({ sukses: false, pesan: "Password wajib diisi." });
      }
      user.password = hashPassword(password);
    }
    if (foto_profile !== undefined) user.foto_profile = foto_profile;

    await user.save();

    res.json({
      sukses: true,
      pesan: "Profil berhasil diperbarui.",
      data: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        foto_profile: user.foto_profile,
      },
    });
  } catch (err) {
    console.error("Update profile error:", err.message);
    res.status(500).json({ sukses: false, pesan: "Gagal memperbarui profil." });
  }
}

module.exports = { register, login, logout, getCurrentUser, updateProfile };
