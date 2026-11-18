/**
 * Middleware autentikasi & peran (role-based) untuk p7.
 *
 * Catatan: aplikasi ini menggunakan express-session (bukan Passport.js), jadi
 * data pengguna (userId, role, nama) disimpan langsung di req.session.
 * Jangan baca req.session.passport (selalu null) — gunakan req.session.userId
 * / req.session.role / req.session.nama.
 *
 * - authRequired: user harus login (session ada user_id).
 * - roleRequired: user harus memiliki role yang diminta.
 *   - 'penjual': hanya pengguna dengan role penjual.
 *   - 'pembeli': hanya pengguna dengan role pembeli.
 */

// --- Wajib login ---
function authRequired(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ sukses: false, pesan: "Wajib login." });
}

// --- Batasi peran ---
function roleRequired(...roles) {
  return (req, res, next) => {
    const userId = req.session ? req.session.userId : null;
    const userRole = req.session ? req.session.role : null;

    if (!userId) {
      return res.status(401).json({ sukses: false, pesan: "Wajib login." });
    }

    // Cek role dari session (set saat login/register)
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        sukses: false,
        pesan: `Akses ditolak. Role ${userRole || "tidak terdaftar"} tidak diizinkan di halaman ini.`,
      });
    }

    return next();
  };
}

const auth = { authRequired, penjual: roleRequired("penjual"), pembeli: roleRequired("pembeli") };

module.exports = auth;
