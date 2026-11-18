const express = require("express");
const router = express.Router();
const { authRequired, penjual, pembeli } = require("../middlewares/authMiddleware");
const { createUsaha, getUsaha, updateUsaha, listUsaha } = require("../controllers/usahaController");

/** Buat/ perbarui profil usaha (penjual) */
router.post("/", authRequired, penjual, createUsaha);

/** Ambil profil usaha (penjual yang sedang login) */
router.get("/", authRequired, penjual, getUsaha);

/** Update profil usaha */
router.put("/", authRequired, penjual, updateUsaha);

/** Daftar toko (penjual) — publik */
router.get("/list", listUsaha);

module.exports = router;
