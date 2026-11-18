const { DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nama: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("penjual", "pembeli"),
      allowNull: false,
      defaultValue: "pembeli",
    },
    foto_profile: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  User.associate = (models) => {
    // 1:1 dengan Usaha (1 pengguna hanya punya 1 profil usaha)
    User.hasOne(models.Usaha, { foreignKey: "user_id", as: "usaha", sourceKey: "id" });
    // 1:N dengan Pesanan (pembeli)
    User.hasMany(models.Pesanan, { foreignKey: "user_id", as: "pesanans", sourceKey: "id" });
    // 1:N dengan Pesanan (penjual)
    User.hasMany(models.Pesanan, { foreignKey: "penjual_id", as: "penjual_pesanans", sourceKey: "id" });
  };

  return User;
};
