const db = require('../models');
const config = require('../config');

exports.index = async (req, res) => {
    try {
        const daftarRoti = await db.Roti.findAll();

        res.render('index', {
            judul: `${config.appName || 'Aplikasi'} - Roti enak`,
            namaToko: config.appName || 'Toko Roti',
            produk: daftarRoti, 
        });
    } catch (err) {
        console.error('Error fetching data for home: ', err.message);
        res.status(500).send('Terjadi kesalahan pada server');
    }
};