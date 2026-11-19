
module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define("Order", {

        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        // ID pembeli yang melakukan pemesanan
        buyerId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        // ID toko tujuan pesanan
        storeId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        // Total harga seluruh produk dalam pesanan
        totalHarga: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },

        // Status pesanan
        status: {
            type: DataTypes.ENUM(
                'menunggu_konfirmasi',
                'diproses',
                'dikirim',
                'selesai',
                'ditolak',
                'dibatalkan'
            ),
            allowNull: false,
            defaultValue: 'menunggu_konfirmasi'
        }

    }, {
        tableName: 'Orders',
        timestamps: true
    });

    Order.associate = (models) => {

        // Satu pesanan dimiliki oleh satu pembeli
        Order.belongsTo(models.User, {
            foreignKey: 'buyerId',
            as: 'buyer'
        });

        // Satu pesanan ditujukan ke satu toko
        Order.belongsTo(models.StoreProfile, {
            foreignKey: 'storeId',
            as: 'store'
        });

        // Satu pesanan memiliki banyak item
        Order.hasMany(models.OrderItem, {
            foreignKey: 'orderId',
            as: 'items',
            onDelete: 'CASCADE'
        });

        // Satu pesanan memiliki banyak riwayat status
        Order.hasMany(models.OrderStatusHistory, {
            foreignKey: 'orderId',
            as: 'statusHistories',
            onDelete: 'CASCADE'
        });

    };

    return Order;
};
