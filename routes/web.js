const express = require('express');
const homeController = require('../controllers/homeController');

const router = express.Router();

const isPenjual = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');
    }

    if (req.session.role !== 'penjual') {
        return res.status(403).send(
            'Akses ditolak: Halaman ini khusus untuk Penjual.'
        );
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

        const user = await db.User.findOne({
            where: { email }
        });

        // Validasi akun
        if (!user || user.password !== password) {
            return res.render('login', {
                error: 'Email atau password salah!'
            });
        }

        // Regenerasi session untuk keamanan
        req.session.regenerate((err) => {
            if (err) {
                console.error('Error regenerasi session:', err);
                return res.status(500).send('Gagal membuat session.');
            }

            // Simpan identitas dan role pengguna
            req.session.userId = user.id;
            req.session.role = user.role;

            // Simpan session sebelum redirect
            req.session.save((saveErr) => {
                if (saveErr) {
                    console.error('Error menyimpan session:', saveErr);
                    return res.status(500).send('Gagal menyimpan session.');
                }

                // Semua pengguna diarahkan ke dashboard utama
                return res.redirect('/dashboard');
            });
        });

    } catch (err) {
        console.error('Error login:', err.message);

        res.render('login', {
            error: 'Terjadi kesalahan pada server saat login.'
        });
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

        req.session.regenerate((err) => {
            if (err) {
                console.error('Error regenerasi session:', err);
                return res.status(500).send('Gagal membuat session.');
            }

            req.session.userId = newUser.id;
            req.session.role = newUser.role;

            req.session.save((saveErr) => {
                if (saveErr) {
                    return res.status(500).send('Gagal menyimpan session.');
                }

                if (newUser.role === 'penjual') {
                    return res.redirect('/seller/dashboard');
                }

                res.redirect('/dashboard');
            });
        });

    } catch (err) {
        console.error('Error register:', err.message);

        res.render('register', {
            error: 'Terjadi kesalahan saat mendaftar, email mungkin sudah digunakan.'
        });
    }
});

router.get('/dashboard', homeController.index);

router.get('/seller/dashboard', isPenjual, async (req, res) => {
    try {
        const db = require('../models');

        const store = await db.StoreProfile.findOne({
            where: { userId: req.session.userId }
        });

        res.render('seller-dashboard', { store });

    } catch (err) {
        console.error('Error loading seller dashboard:', err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/seller/profile', isPenjual, async (req, res) => {
    try {
        const {
            nama_toko,
            nomor_telepon,
            alamat_toko,
            caption_produk
        } = req.body;

        const db = require('../models');
        const currentUserId = req.session.userId;

        const [store, created] = await db.StoreProfile.findOrCreate({
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
        res.status(500).send(
            'Gagal menyimpan profil toko: ' + err.message
        );
    }
});

router.get('/seller/profile-preview', isPenjual, async (req, res) => {
    try {
        const db = require('../models');

        const store = await db.StoreProfile.findOne({
            where: { userId: req.session.userId }
        });

        if (!store) {
            return res.redirect('/seller/dashboard');
        }

        const rotis = await db.Roti.findAll({
            where: { storeId: store.id }
        });

        res.render('seller-preview', {
            store,
            rotis
        });

    } catch (err) {
        console.error('Error loading preview:', err.message);
        res.status(500).send('Server Error');
    }
});

// Tambah Produk Roti
router.post('/seller/roti/add', isPenjual, async (req, res) => {
    try {
        const {
            nama,
            kategori,
            deskripsi,
            harga,
            stok
        } = req.body;

        const db = require('../models');

        const store = await db.StoreProfile.findOne({
            where: { userId: req.session.userId }
        });

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
        res.status(500).send(
            'Gagal menambahkan produk roti: ' + err.message
        );
    }
});


router.get('/toko/:id', async (req, res) => {
    try {
        const storeId = req.params.id;
        const db = require('../models');

        const store = await db.StoreProfile.findByPk(storeId);

        if (!store) {
            return res.status(404).send('Toko tidak ditemukan!');
        }

        const rotis = await db.Roti.findAll({
            where: { storeId: storeId }
        });

        res.render('store-detail', {
            store,
            rotis
        });

    } catch (err) {
        console.error('Error loading store detail:', err.message);
        res.status(500).send('Server Error: ' + err.message);
    }
});

router.post('/logout', (req, res) => {
    if (!req.session) {
        return res.redirect('/login');
    }

    req.session.destroy((err) => {
        if (err) {
            console.error('Error logout:', err);
            return res.status(500).send('Gagal logout.');
        }

        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

module.exports = router;