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
    });

    StoreProfile.associate = (models) => {
        StoreProfile.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    };

    return StoreProfile;
};