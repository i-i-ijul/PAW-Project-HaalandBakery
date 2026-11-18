const express = require("express");
const router = express.Router();
const { register, login, logout, getCurrentUser, updateProfile } = require("../controllers/authController");

/** Registrasi */
router.post("/register", register);

/** Login */
router.post("/login", login);

/** Logout */
router.post("/logout", logout);

/** Data pengguna aktif */
router.get("/me", getCurrentUser);

/** Update profil */
router.put("/profile", updateProfile);

module.exports = router;
