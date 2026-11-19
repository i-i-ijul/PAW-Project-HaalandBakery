module.exports = (sequelize, DataTypes) => {
    const StoreProfile = sequelize.define("StoreProfile", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nama_toko: {
            type: DataTypes.STRING,
            allowNull: false
        },
        nomor_telepon: {
            type: DataTypes.STRING,
            allowNull: false
        },
        alamat_toko: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        caption_produk: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true // <-- Ubah jadi true agar tidak wajib saat error relasi
        }
    }, {
        tableName: 'StoreProfiles'
    });

    StoreProfile.associate = (models) => {

    // Toko dimiliki oleh satu user
    StoreProfile.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'owner'
    });

    // Toko memiliki banyak produk roti
    StoreProfile.hasMany(models.Roti, {
        foreignKey: 'storeId',
        as: 'rotis'
    });

    // Toko dapat menerima banyak pesanan
    StoreProfile.hasMany(models.Order, {
        foreignKey: 'storeId',
        as: 'orders'
    });

};
    return StoreProfile;
};