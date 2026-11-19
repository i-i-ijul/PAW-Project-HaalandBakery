module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define("User", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nama: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('pembeli', 'penjual'),
            allowNull: false,
            defaultValue: 'pembeli'
        }
    });

    User.associate = (models) => {

    // Satu user memiliki satu profil toko
    User.hasOne(models.StoreProfile, {
        foreignKey: 'userId',
        as: 'storeProfile'
    });

    // Satu user dapat membuat banyak pesanan
    User.hasMany(models.Order, {
        foreignKey: 'buyerId',
        as: 'orders'
    });

    // Satu user dapat melakukan banyak perubahan status
    User.hasMany(models.OrderStatusHistory, {
        foreignKey: 'changedBy',
        as: 'orderStatusChanges'
    });

};
    return User;
};