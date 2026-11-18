const { StoreProfile, Roti } = require('../models');
const { Op } = require('sequelize');

async function index(req, res) {
    try {
        const searchQuery = req.query.search || '';
        
        let storeCondition = {};
        if (searchQuery) {
            storeCondition = {
                nama_toko: {
                    [Op.iLike]: `%${searchQuery}%`
                }
            };
        }

        // Ambil daftar toko beserta produk roti miliknya (jika asosiasi model sudah diset)
        const stores = await StoreProfile.findAll({
            where: storeCondition,
            include: [{
                model: Roti,
                as: 'rotis' // Pastikan asosiasi di model StoreProfile sudah mendefinisikan ini, atau bisa di-load terpisah
            }]
        });


    res.render('index', {
        stores,
        searchQuery,
        namaToko: "Toko Roti",
        userRole: req.session.role || null
    });

    } catch (err) {
        console.error('Error loading dashboard:', err.message);
        res.status(500).send('Server Error');
    }
}

module.exports = {
    index
};