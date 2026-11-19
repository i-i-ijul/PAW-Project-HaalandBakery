module.exports = (sequelize, DataTypes) => {
    const Roti = sequelize.define("Roti", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nama: {
            type: DataTypes.STRING,
            allowNull: false
        },
        kategori: {
            type: DataTypes.STRING,
            allowNull: false
        },
        deskripsi: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        harga: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        stok: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        storeId: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }, {
        tableName: 'roti',
        timestamps: false
    });

    Roti.associate = (models) => {

    // Produk dimiliki oleh satu toko
    if (models.StoreProfile) {
        Roti.belongsTo(models.StoreProfile, {
            foreignKey: 'storeId',
            as: 'store'
        });
    }

    // Produk dapat muncul dalam banyak detail pesanan
    Roti.hasMany(models.OrderItem, {
        foreignKey: 'rotiId',
        as: 'orderItems'
    });

};

    return Roti;
};