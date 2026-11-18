const express = require("express");
const router = express.Router();
const { authRequired } = require("../middlewares/authMiddleware");
const { index, show, store, updateStatus } = require("../controllers/pesananController");

/** Daftar pesanan (pembeli: miliknya; penjual: pesanan tokonya) */
router.get("/", authRequired, index);

/** Detail pesanan */
router.get("/:id", authRequired, show);

/** Buat pesanan (pembeli) */
router.post("/", authRequired, store);

/** Update status pesanan (penjual) */
router.put("/:id/status", authRequired, updateStatus);

module.exports = router;
