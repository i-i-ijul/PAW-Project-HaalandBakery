const { DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    const Roti = sequelize.define("Roti", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nama: {
            type: DataTypes.STRING,
        },
        kategori: {
            type: DataTypes.STRING,
        },
        deskripsi: {
            type: DataTypes.STRING,
        },
        harga: {
          type: DataTypes.INTEGER,
        },
        stok: {
          type: DataTypes.INTEGER,
        }
    });
    return Roti;
};