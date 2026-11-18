const express = require("express");
const homeController = require("../controllers/homeController");
const auth = require("../middlewares/authMiddleware");

const router = express.Router();

// Halaman utama: jika sudah login, arahkan ke halaman role
router.get("/", (req, res) => {
  if (req.session && req.session.userId) {
    return req.session.role === "penjual"
      ? res.redirect("/dashboard")
      : res.redirect("/pesanan");
  }
  res.redirect("/login");
});

// Halaman login
router.get("/login", (req, res) => {
  const redirect = req.query.redirect || "/pesanan";
  res.status(401).render("login", {
    judul: "Login",
    pesan: req.query.pesan || null,
    redirect,
    role: req.session.role || null,
  });
});

// Halaman daftar (register)
router.get("/register", (req, res) => {
  res.status(401).render("register", { judul: "Daftar", pesan: req.query.pesan || null });
});

// Dashboard penjual
router.get("/dashboard", auth.authRequired, (req, res) => {
  if (req.session.role === "penjual") {
    return res.render("seller/dashboard", { judul: "Dashboard Penjual" });
  }
  res.redirect("/pesanan");
});

// Halaman pesanan (pelacakan)
router.get("/pesanan", auth.authRequired, (req, res) => {
  res.render("pesanan/list", { judul: "Pesanan", role: req.session.role || null });
});

// Logout
router.get("/logout", (req, res) => {
  require("../controllers/authController").logout(req, res).then(() => {
    res.redirect("/?pesan=logout");
  }).catch(() => {
    res.redirect("/?pesan=logout");
  });
});

module.exports = router;