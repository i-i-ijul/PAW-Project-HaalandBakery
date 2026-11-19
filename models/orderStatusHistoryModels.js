
module.exports = (sequelize, DataTypes) => {
    const OrderStatusHistory = sequelize.define(
        "OrderStatusHistory",
        {

            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            // ID pesanan yang mengalami perubahan status
            orderId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            // Status terbaru yang dicatat
            status: {
                type: DataTypes.ENUM(
                    'menunggu_konfirmasi',
                    'diproses',
                    'dikirim',
                    'selesai',
                    'ditolak',
                    'dibatalkan'
                ),
                allowNull: false
            },

            // Keterangan tambahan perubahan status
            keterangan: {
                type: DataTypes.TEXT,
                allowNull: true
            },

            // User yang melakukan perubahan
            changedBy: {
                type: DataTypes.INTEGER,
                allowNull: true
            }

        },
        {
            tableName: 'OrderStatusHistories',
            timestamps: true,
            updatedAt: false
        }
    );

    OrderStatusHistory.associate = (models) => {

        // Riwayat dimiliki oleh satu pesanan
        OrderStatusHistory.belongsTo(models.Order, {
            foreignKey: 'orderId',
            as: 'order'
        });

        // User yang melakukan perubahan status
        OrderStatusHistory.belongsTo(models.User, {
            foreignKey: 'changedBy',
            as: 'actor',
            onDelete: 'SET NULL'
        });

    };

    return OrderStatusHistory;
};
