/**
 * Controller pesanan (order) + lacak pengiriman (tracking).
 *
 * - index: daftar pesanan (pembeli lihat miliknya, penjual lihat pesanan
 *           milik tokonya yang diambil dari usaha -> user).
 * - show: detail satu pesanan.
 * - store: buat pesanan baru (pembeli).
 * - updateStatus: ganti status pesanan (hanya penjual).
 */

const db = require("../models");

// Status yang memungkinkan terjemahan ke tampilan peringkat
const STATUS_RANK = {
  menunggu_pembayaran: 1,
  dikonfirmasi: 2,
  diproses: 3,
  dikirim: 4,
  diterima: 5,
  batal: 0,
};

const STATUS_LABEL = {
  menunggu_pembayaran: "Menunggu Pembayaran",
  dikonfirmasi: "Dikonfirmasi",
  diproses: "Diproses",
  dikirim: "Dikirim",
  diterima: "Diterima",
  batal: "Dibatalkan",
};

function resolveSellerForOrder(order) {
  // order.penjual_id sudah disimpan. Coba ambil via relasi.
  return order.penjual ? order.penjual.nama : null;
}

async function index(req, res) {
  const userId = req.session ? req.session.userId : null;
  if (!userId) {
    return res.status(401).json({ sukses: false, pesan: "Wajib login." });
  }

  try {
    let orders;

    if (req.session && req.session.role === "penjual") {
      // Penjual: lihat pesanan untuk tokonya sendiri
      const usaha = await db.Usaha.findOne({ where: { user_id: userId } });
      if (!usaha) {
        return res.json({
          sukses: true,
          pesan: "Anda belum punya profil usaha.",
          data: [],
        });
      }
      // penjual_id menyimpan user id penjual, bukan id usaha
      orders = await db.Pesanan.findAll({
        where: { penjual_id: userId },
        include: [{ model: db.User, as: "penjual" }],
        order: [["createdAt", "DESC"]],
      });
    } else {
      // Pembeli: lihat pesanan miliknya sendiri
      orders = await db.Pesanan.findAll({
        where: { user_id: userId },
        include: [{ model: db.User, as: "penjual" }],
        order: [["createdAt", "DESC"]],
      });
    }

    const data = orders.map((o) => ({
      id: o.id,
      produk_nama: o.produk_nama,
      deskripsi: o.deskripsi,
      harga: o.harga,
      jumlah: o.jumlah,
      total_harga: o.total_harga,
      status: o.status,
      status_label: STATUS_LABEL[o.status] || o.status,
      nomor_resi: o.nomor_resi || null,
      alamat_pengiriman: o.alamat_pengiriman,
      catatan: o.catatan || null,
      dibuat_pada: o.createdAt ? o.createdAt.toISOString().slice(0, 19).replace("T", " ") : null,
      penjual: resolveSellerForOrder(o),
    }));

    res.json({
      sukses: true,
      data,
      total: data.length,
    });
  } catch (err) {
    console.error("List pesanan error:", err.message);
    res.status(500).json({ sukses: false, pesan: "Gagal mengambil daftar pesanan." });
  }
}

async function show(req, res) {
  const userId = req.session ? req.session.userId : null;
  if (!userId) {
    return res.status(401).json({ sukses: false, pesan: "Wajib login." });
  }

  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ sukses: false, pesan: "ID pesanan tidak valid." });
  }

  try {
    let order = await db.Pesanan.findOne({
      where: { id: Number(id) },
      include: [
        { model: db.User, as: "pembeli" },
        { model: db.User, as: "penjual" },
      ],
    });

    if (!order) {
      return res.status(404).json({ sukses: false, pesan: "Pesanan tidak ditemukan." });
    }

    // Izin akses:
    // - Pembeli: hanya pesanan miliknya
    // - Penjual: pesanan milik tokonya (penjual_id = user id penjual)
    if (req.session.role === "pembeli") {
      if (order.pembeli.id !== userId) {
        return res.status(403).json({ sukses: false, pesan: "Akses ditolak." });
      }
    } else {
      if (order.penjual_id !== userId) {
        return res.status(403).json({ sukses: false, pesan: "Akses ditolak." });
      }
    }

    const { user_id, penjual_id, produk_nama, deskripsi, harga, stok, jumlah, total_harga, status, nomor_resi, alamat_pengiriman, catatan, createdAt, updatedAt } = order;

    res.json({
      sukses: true,
      data: {
        id,
        user_id,
        penjual_id,
        produk_nama,
        deskripsi,
        harga,
        stok,
        jumlah,
        total_harga,
        status,
        status_label: STATUS_LABEL[status] || status,
        nomor_resi,
        alamat_pengiriman,
        catatan,
        dibuat_pada: createdAt ? createdAt.toISOString().slice(0, 19).replace("T", " ") : null,
        diperbarui_pada: updatedAt ? updatedAt.toISOString().slice(0, 19).replace("T", " ") : null,
        pembeli_nama: order.pembeli ? order.pembeli.nama : null,
        penjual_nama: order.penjual ? order.penjual.nama : null,
      },
    });
  } catch (err) {
    console.error("Detail pesanan error:", err.message);
    res.status(500).json({ sukses: false, pesan: "Gagal mengambil detail pesanan." });
  }
}

async function store(req, res) {
  const userId = req.session ? req.session.userId : null;
  if (!userId) {
    return res.status(401).json({ sukses: false, pesan: "Wajib login." });
  }

  const { produk_nama, deskripsi, harga, stok, jumlah, total_harga, alamat_pengiriman, catatan, penjual_id } = req.body;

  if (!produk_nama || !deskripsi || !harga || !stok || !jumlah || !total_harga || !alamat_pengiriman) {
    return res.status(400).json({
      sukses: false,
      pesan: "Nama produk, deskripsi, harga, stok, jumlah, total harga, dan alamat pengiriman wajib diisi.",
    });
  }

  if (jumlah < 1) {
    return res.status(400).json({ sukses: false, pesan: "Jumlah minimal 1." });
  }

  try {
    // Pastikan user adalah pembeli
    const buyer = await db.User.findByPk(userId);
    if (!buyer || buyer.role !== "pembeli") {
      return res.status(403).json({ sukses: false, pesan: "Hanya pembeli yang bisa membuat pesanan." });
    }

    // Pastikan penjual_id valid & toko ada
    const sellerUser = await db.User.findByPk(penjual_id);
    if (!sellerUser) {
      return res.status(400).json({ sukses: false, pesan: "Penjual tidak ditemukan." });
    }
    const sellerUsaha = await db.Usaha.findOne({ where: { user_id: penjual_id } });
    if (!sellerUsaha) {
      return res.status(400).json({ sukses: false, pesan: "Penjual belum membuat profil usaha." });
    }

    const pesanan = await db.Pesanan.create({
      user_id: userId,
      penjual_id: penjual_id,
      produk_nama,
      deskripsi,
      harga,
      stok,
      jumlah,
      total_harga,
      alamat_pengiriman,
      catatan: catatan || null,
    });

    res.status(201).json({
      sukses: true,
      pesan: "Pesanan berhasil dibuat.",
      data: {
        id: pesanan.id,
        produk_nama: pesanan.produk_nama,
        deskripsi: pesanan.deskripsi,
        harga: pesanan.harga,
        stok: pesanan.stok,
        jumlah: pesanan.jumlah,
        total_harga: pesanan.total_harga,
        alamat_pengiriman: pesanan.alamat_pengiriman,
        catatan: pesanan.catatan || null,
        status: pesanan.status,
        status_label: STATUS_LABEL[pesanan.status] || pesanan.status,
        dibuat_pada: pesanan.createdAt ? pesanan.createdAt.toISOString().slice(0, 19).replace("T", " ") : null,
      },
    });
  } catch (err) {
    console.error("Create pesanan error:", err.message);
    res.status(500).json({ sukses: false, pesan: "Gagal membuat pesanan." });
  }
}

async function updateStatus(req, res) {
  const userId = req.session ? req.session.userId : null;
  if (!userId) {
    return res.status(401).json({ sukses: false, pesan: "Wajib login." });
  }

  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ sukses: false, pesan: "ID pesanan tidak valid." });
  }

  const { status } = req.body;
  const validStatuses = Object.keys(STATUS_LABEL);
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      sukses: false,
      pesan: "Status tidak valid.",
    });
  }

  try {
    const order = await db.Pesanan.findByPk(Number(id));
    if (!order) {
      return res.status(404).json({ sukses: false, pesan: "Pesanan tidak ditemukan." });
    }

    // Cek akses: hanya penjual yang bisa update status
    const user = await db.User.findByPk(userId);
    if (!user || user.role !== "penjual") {
      return res.status(403).json({ sukses: false, pesan: "Hanya penjual yang bisa mengubah status pesanan." });
    }

    // Pastikan pesanan dimiliki oleh penjual yang sedang login
    if (order.penjual_id !== userId) {
      return res.status(403).json({ sukses: false, pesan: "Akses ditolak." });
    }

    // Validasi alur status (tidak bisa mundur kebalikannya)
    const currentRank = STATUS_RANK[order.status];
    const newRank = STATUS_RANK[status];
    if (newRank < currentRank) {
      return res.status(400).json({
        sukses: false,
        pesan: "Tidak bisa mengubah status ke yang lebih awal.",
      });
    }

    order.status = status;
    if (status === "dikirim" && !order.nomor_resi) {
      // Jika berpindah ke dikirim, minta nomor resi (opsional di form)
      // Biarkan null; aplikasi client memutuskan memberi nilai
    }
    await order.save();

    res.json({
      sukses: true,
      pesan: "Status pesanan diperbarui.",
      data: {
        id: order.id,
        status: order.status,
        status_label: STATUS_LABEL[order.status] || order.status,
        nomor_resi: order.nomor_resi || null,
        diperbarui_pada: order.updatedAt
          ? order.updatedAt.toISOString().slice(0, 19).replace("T", " ")
          : null,
      },
    });
  } catch (err) {
    console.error("Update status pesanan error:", err.message);
    res.status(500).json({ sukses: false, pesan: "Gagal memperbarui status pesanan." });
  }
}

module.exports = { index, show, store, updateStatus };
