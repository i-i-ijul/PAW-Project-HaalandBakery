module.exports = (sequelize, DataTypes) => {
    const Roti = sequelize.define("Roti", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nama: {
            type: DataTypes.STRING(100), 
        },
        kategori: {
            type: DataTypes.STRING(50),  
            allowNull: false
        },
        deskripsi: {
            type: DataTypes.STRING(500), 
            allowNull: true
        },
        harga: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        stok: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        tableName: 'roti'
    });

    return Roti;
};