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

module.exports = {
  getAllRoti,
  getRotiById,
  createRoti,
  updateRoti,
  deleteRoti,
  getStatus: (req, res) => {
    res.json({ status: "ok", message: "Server siap" });
  },
};