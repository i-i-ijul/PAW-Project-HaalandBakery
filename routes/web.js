const express = require('express');
const homeController = require('../controllers/homeController');

const router = express.Router();

// --- MIDDLEWARE KHUSUS PENJUAL ---
// Fungsi ini memastikan hanya user ber-role 'penjual' yang boleh masuk
const isPenjual = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');
    }
    if (req.session.role !== 'penjual') {
        // Jika pembeli nekat masuk ke halaman penjual, lempar balik ke /dashboard
        return res.status(403).send('Akses ditolak: Halaman ini khusus untuk Penjual.');
        // Atau bisa juga: return res.redirect('/dashboard');
    }
    next();
};

router.get('/', (req, res) => {
    res.render('login', { error: null });
});

router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

router.get('/register', (req, res) => {
    res.render('register', { error: null });
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = require('../models');

        const user = await db.User.findOne({ where: { email } });

        if (!user || user.password !== password) {
            return res.render('login', { error: 'Email atau password salah!' });
        }

        req.session.userId = user.id;
        req.session.role = user.role;

        if (user.role === 'penjual') {
            const store = await db.StoreProfile.findOne({ where: { userId: user.id } });
            if (store) {
                return res.redirect('/seller/profile-preview');
            } else {
                return res.redirect('/seller/dashboard');
            }
        } else {
            return res.redirect('/dashboard');
        }

    } catch (err) {
        console.error('Error login:', err.message);
        res.render('login', { error: 'Terjadi kesalahan pada server saat login.' });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { nama, email, password, role } = req.body;
        const db = require('../models');

        const newUser = await db.User.create({
            nama,
            email,
            password,
            role: role || 'pembeli'
        });

        req.session.userId = newUser.id;
        req.session.role = newUser.role; // Simpan role ke session saat registrasi

        if (newUser.role === 'penjual') {
            res.redirect('/seller/dashboard');
        } else {
            res.redirect('/dashboard');
        }
    } catch (err) {
        console.error('Error register:', err.message);
        res.render('register', { error: 'Terjadi kesalahan saat mendaftar, email mungkin sudah digunakan.' });
    }
});

// Dashboard Utama Marketplace (Bisa diakses pembeli & umum)
router.get('/dashboard', homeController.index);

// ==========================================
// RUTE KHUSUS PENJUAL (Diberi Middleware isPenjual)
// ==========================================

router.get('/seller/dashboard', isPenjual, async (req, res) => {
    try {
        const db = require('../models');
        let store = await db.StoreProfile.findOne({ where: { userId: req.session.userId } });
        res.render('seller-dashboard', { store });
    } catch (err) {
        console.error('Error loading seller dashboard:', err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/seller/profile', isPenjual, async (req, res) => {
    try {
        const { nama_toko, nomor_telepon, alamat_toko, caption_produk } = req.body;
        const db = require('../models');
        const currentUserId = req.session.userId;

        let [store, created] = await db.StoreProfile.findOrCreate({
            where: { userId: currentUserId },
            defaults: {
                nama_toko,
                nomor_telepon,
                alamat_toko,
                caption_produk,
                userId: currentUserId
            }
        });

        if (!created) {
            await store.update({
                nama_toko,
                nomor_telepon,
                alamat_toko,
                caption_produk
            });
        }

        res.redirect('/seller/profile-preview');
    } catch (err) {
        console.error('Error saving store profile:', err.message);
        res.status(500).send('Gagal menyimpan profil toko: ' + err.message);
    }
});

router.get('/seller/profile-preview', isPenjual, async (req, res) => {
    try {
        const db = require('../models');
        const store = await db.StoreProfile.findOne({ where: { userId: req.session.userId } });
        
        if (!store) {
            return res.redirect('/seller/dashboard');
        }

        const rotis = await db.Roti.findAll({ where: { storeId: store.id } });
        res.render('seller-preview', { store, rotis });
    } catch (err) {
        console.error('Error loading preview:', err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/seller/roti/add', isPenjual, async (req, res) => {
    try {
        const { nama, kategori, deskripsi, harga, stok } = req.body;
        const db = require('../models');
        const store = await db.StoreProfile.findOne({ where: { userId: req.session.userId } });

        if (!store) {
            return res.status(400).send('GAGAL: Toko belum dibuat.');
        }

        await db.Roti.create({
            nama,
            kategori,
            deskripsi,
            harga,
            stok,
            storeId: store.id 
        });

        res.redirect('/seller/profile-preview');
    } catch (err) {
        console.error('Error adding roti:', err.message);
        res.status(500).send('Gagal menambahkan produk roti: ' + err.message);
    }
});

// Halaman Detail Toko (Bisa dilihat siapa saja / pembeli)
router.get('/toko/:id', async (req, res) => {
    try {
        const storeId = req.params.id;
        const db = require('../models');

        const store = await db.StoreProfile.findByPk(storeId);
        if (!store) {
            return res.status(404).send('Toko tidak ditemukan!');
        }

        const rotis = await db.Roti.findAll({ where: { storeId: storeId } });
        res.render('store-detail', { store, rotis });
    } catch (err) {
        console.error('Error loading store detail:', err.message);
        res.status(500).send('Server Error: ' + err.message);
    }
});

module.exports = router;