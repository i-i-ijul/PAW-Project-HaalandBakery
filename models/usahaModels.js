const { DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const Usaha = sequelize.define("Usaha", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    nama_toko: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nomor_telepon: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    alamat_toko: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  });

  Usaha.associate = (models) => {
    // 1:1 User <-> Usaha (user sudah berasosiasi di userModels)
    Usaha.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
    // 1:N Pesanan (penjual)
    Usaha.hasMany(models.Pesanan, { foreignKey: "penjual_id", as: "pesanans" });
  };

  return Usaha;
};
