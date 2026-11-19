
module.exports = (sequelize, DataTypes) => {
    const OrderItem = sequelize.define("OrderItem", {

        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        // Relasi ke tabel Orders
        orderId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        // Referensi produk asli
        // Nullable agar histori tetap ada jika produk dihapus
        rotiId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },

        // Snapshot nama produk saat dibeli
        namaProduk: {
            type: DataTypes.STRING,
            allowNull: false
        },

        // Snapshot harga produk saat dibeli
        harga: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        // Jumlah produk yang dibeli
        jumlah: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        // Harga x jumlah
        subtotal: {
            type: DataTypes.INTEGER,
            allowNull: false
        }

    }, {
        tableName: 'OrderItems',
        timestamps: true
    });

    OrderItem.associate = (models) => {

        // Item merupakan bagian dari satu pesanan
        OrderItem.belongsTo(models.Order, {
            foreignKey: 'orderId',
            as: 'order'
        });

        // Item merujuk ke produk roti
        OrderItem.belongsTo(models.Roti, {
            foreignKey: 'rotiId',
            as: 'roti',
            onDelete: 'SET NULL'
        });

    };

    return OrderItem;
};
