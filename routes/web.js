const express = require('express');
const homeController = require('../controllers/homeController');
// Jika kamu membuat authController terpisah, import di sini. 
// Untuk praktisnya, kita bisa buat fungsi controllernya langsung atau di homeController.

const router = express.Router();

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

        // 1. Cari user berdasarkan email
        const user = await db.User.findOne({ where: { email } });

        // 2. Cek apakah user ada dan password cocok
        if (!user || user.password !== password) {
            return res.render('login', { error: 'Email atau password salah!' });
        }

        // 3. Simpan informasi user ke session
        req.session.userId = user.id;
        req.session.role = user.role;

        // 4. Arahkan berdasarkan role user
        if (user.role === 'penjual') {
            // Cek apakah penjual sudah pernah mengisi profil toko
            const store = await db.StoreProfile.findOne({ where: { userId: user.id } });
            if (store) {
                return res.redirect('/dashboard'); // Sudah punya toko -> langsung dashboard utama
            } else {
                return res.redirect('/seller/dashboard'); // Belum setup toko -> lengkapi profil dulu
            }
        } else {
            // Pembeli -> langsung ke dashboard utama
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

        // Simpan ID user ke session agar dikenali di halaman berikutnya
        req.session.userId = newUser.id;

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

router.get('/dashboard', homeController.index);

// Halaman Dashboard Penjual
router.get('/seller/dashboard', async (req, res) => {
    try {
        const db = require('../models');
        // Untuk sementara, kita ambil profil toko pertama (atau nanti disesuaikan dengan session user yang login)
        const store = await db.StoreProfile.findOne();
        res.render('seller-dashboard', { store });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.post('/seller/profile', async (req, res) => {
    try {
        const { nama_toko, nomor_telepon, alamat_toko, caption_produk } = req.body;
        const db = require('../models');

        // 1. Cek dari session dulu
        let currentUserId = req.session ? req.session.userId : null;

        // 2. Fallback: kalau tidak lewat register/login, ambil user yang sudah ada di tabel Users
        if (!currentUserId) {
            const existingUser = await db.User.findOne({ order: [['id', 'DESC']] });
            if (existingUser) {
                currentUserId = existingUser.id;
            } else {
                // Jika tabel Users masih kosong melompong, buatkan 1 akun penjual default
                const defaultSeller = await db.User.create({
                    nama: 'Penjual Default',
                    email: 'seller@tokoroti.com',
                    password: 'password123',
                    role: 'penjual'
                });
                currentUserId = defaultSeller.id;
            }
        }

        let store = await db.StoreProfile.findOne({ where: { userId: currentUserId } });

        if (store) {
            await store.update({
                nama_toko,
                nomor_telepon,
                alamat_toko,
                caption_produk
            });
        } else {
            await db.StoreProfile.create({
                nama_toko,
                nomor_telepon,
                alamat_toko,
                caption_produk,
                userId: currentUserId
            });
        }

        res.redirect('/seller/profile-preview');
    } catch (err) {
        console.error('Error saving store profile:', err.message);
        res.status(500).send('Gagal menyimpan profil toko: ' + err.message);
    }
});

// Halaman Preview Profil Toko
router.get('/seller/profile-preview', async (req, res) => {
    try {
        const db = require('../models');
        const store = await db.StoreProfile.findOne();
        if (!store) {
            return res.redirect('/seller/dashboard');
        }
        res.render('seller-preview', { store });
    } catch (err) {
        console.error('Error loading preview:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;