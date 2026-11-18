const express = require("express");
const router = express.Router();
const { getStatus } = require("../controllers/apiController");
const auth = require("../middlewares/authMiddleware");

const {
  getAllRoti,
  getRotiById,
  createRoti,
  updateRoti,
  deleteRoti,
  captionProduct,
} = require("../controllers/apiController");

router.get("/status", getStatus);
router.get("/produk", getAllRoti);
router.get("/produk/:id", getRotiById);
router.post("/produk", createRoti);
router.put("/produk/:id", updateRoti);
router.delete("/produk/:id", deleteRoti);

// Caption bot AI (hanya penjual) — /api/caption
router.post("/caption", auth.authRequired, auth.penjual, captionProduct);

module.exports = router;