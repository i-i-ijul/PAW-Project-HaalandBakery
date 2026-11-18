const { DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const Pesanan = sequelize.define("Pesanan", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    penjual_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    produk_nama: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    deskripsi: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    harga: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stok: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    jumlah: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    total_harga: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        "menunggu_pembayaran",
        "dikonfirmasi",
        "diproses",
        "dikirim",
        "diterima",
        "batal"
      ),
      allowNull: false,
      defaultValue: "menunggu_pembayaran",
    },
    nomor_resi: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    alamat_pengiriman: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    catatan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  Pesanan.associate = (models) => {
    Pesanan.belongsTo(models.User, { foreignKey: "user_id", as: "pembeli" });
    Pesanan.belongsTo(models.User, { foreignKey: "penjual_id", as: "penjual" });
  };

  return Pesanan;
};
