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

const isPembeli = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');
    }

    if (req.session.role !== 'pembeli') {
        return res.status(403).send(
            'Akses ditolak: Fitur ini khusus untuk Pembeli.'
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

// ==========================================
// HALAMAN PESANAN SAYA - PEMBELI
// ==========================================
router.get('/buyer/orders', isPembeli, async (req, res) => {
    try {
        const db = require('../models');

        const orders = await db.Order.findAll({
            where: {
                buyerId: req.session.userId
            },

            include: [
                {
                    model: db.StoreProfile,
                    as: 'store',
                    attributes: ['id', 'nama_toko']
                },
                {
                    model: db.OrderItem,
                    as: 'items',
                    attributes: [
                        'id',
                        'namaProduk',
                        'harga',
                        'jumlah',
                        'subtotal'
                    ]
                },
                {
                    model: db.OrderStatusHistory,
                    as: 'statusHistories',
                    separate: true,
                    order: [['createdAt', 'ASC']],
                    attributes: [
                        'id',
                        'status',
                        'keterangan',
                        'createdAt'
                    ]
                }
            ],

            order: [['createdAt', 'DESC']]
        });

        res.render('buyer-orders', {
            orders
        });

    } catch (err) {
        console.error('Error memuat pesanan pembeli:', err);

        res.status(500).send(
            'Gagal memuat pesanan: ' + err.message
        );
    }
});

router.get('/seller/dashboard', isPenjual, async (req, res) => {
    try {
        const db = require('../models');

        // Ambil toko milik penjual yang sedang login
        const store = await db.StoreProfile.findOne({
            where: { userId: req.session.userId }
        });

        let orders = [];

        // Ambil pesanan jika penjual sudah memiliki toko
        if (store) {
            orders = await db.Order.findAll({
                where: { storeId: store.id },

                include: [
                    {
                        model: db.User,
                        as: 'buyer',
                        attributes: ['id', 'nama', 'email']
                    },
                    {
                        model: db.OrderItem,
                        as: 'items',
                        attributes: [
                            'id',
                            'namaProduk',
                            'harga',
                            'jumlah',
                            'subtotal'
                        ]
                    }
                ],

                order: [['createdAt', 'DESC']]
            });
        }

        res.render('seller-dashboard', {
            store,
            orders
        });

    } catch (err) {
        console.error('Error loading seller dashboard:', err);
        res.status(500).send('Gagal memuat dashboard penjual: ' + err.message);
    }
});


// ==========================================
// TERIMA PESANAN
// ==========================================
router.post('/seller/orders/:id/accept', isPenjual, async (req, res) => {
    const db = require('../models');

    try {
        const orderId = Number(req.params.id);
        const userId = req.session.userId;

        await db.sequelize.transaction(async (transaction) => {

            // 1. Cari toko milik penjual
            const store = await db.StoreProfile.findOne({
                where: { userId },
                transaction
            });

            if (!store) {
                throw new Error('Toko tidak ditemukan.');
            }

            // 2. Kunci pesanan agar tidak diproses dua kali bersamaan
            const order = await db.Order.findOne({
                where: {
                    id: orderId,
                    storeId: store.id
                },
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!order) {
                throw new Error('Pesanan tidak ditemukan.');
            }

            if (order.status !== 'menunggu_konfirmasi') {
                throw new Error('Pesanan ini sudah pernah diproses.');
            }

            // 3. Ambil seluruh item pesanan
            const items = await db.OrderItem.findAll({
                where: { orderId: order.id },
                transaction
            });

            if (items.length === 0) {
                throw new Error('Pesanan tidak memiliki rincian produk.');
            }

            // 4. Periksa dan kurangi stok setiap produk
            for (const item of items) {

                if (!item.rotiId) {
                    throw new Error(
                        `Produk ${item.namaProduk} tidak lagi tersedia.`
                    );
                }

                // Kunci baris produk agar stok tidak berubah
                // ketika sedang diperiksa dan dikurangi
                const roti = await db.Roti.findOne({
                    where: {
                        id: item.rotiId,
                        storeId: store.id
                    },
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });

                if (!roti) {
                    throw new Error(
                        `Produk ${item.namaProduk} tidak ditemukan di toko.`
                    );
                }

                if (Number(roti.stok) < Number(item.jumlah)) {
                    throw new Error(
                        `Stok ${roti.nama} tidak mencukupi. Stok tersedia: ${roti.stok}.`
                    );
                }

                await roti.decrement('stok', {
                    by: Number(item.jumlah),
                    transaction
                });
            }

            // 5. Ubah status pesanan
            await order.update({
                status: 'diproses'
            }, { transaction });

            // 6. Catat riwayat perubahan status
            await db.OrderStatusHistory.create({
                orderId: order.id,
                status: 'diproses',
                keterangan: 'Penjual menerima pesanan dan mulai memprosesnya.',
                changedBy: userId
            }, { transaction });

        });

        return res.redirect('/seller/dashboard');

    } catch (err) {
        console.error('Error menerima pesanan:', err);

        return res.status(400).send(
            'Gagal menerima pesanan: ' + err.message
        );
    }
});


// ==========================================
// TOLAK PESANAN
// ==========================================
router.post('/seller/orders/:id/reject', isPenjual, async (req, res) => {
    const db = require('../models');

    try {
        const orderId = Number(req.params.id);
        const userId = req.session.userId;

        await db.sequelize.transaction(async (transaction) => {

            // 1. Cari toko milik penjual
            const store = await db.StoreProfile.findOne({
                where: { userId },
                transaction
            });

            if (!store) {
                throw new Error('Toko tidak ditemukan.');
            }

            // 2. Kunci pesanan dan pastikan milik toko ini
            const order = await db.Order.findOne({
                where: {
                    id: orderId,
                    storeId: store.id
                },
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!order) {
                throw new Error('Pesanan tidak ditemukan.');
            }

            if (order.status !== 'menunggu_konfirmasi') {
                throw new Error('Pesanan ini sudah pernah diproses.');
            }

            // 3. Ubah status menjadi ditolak
            await order.update({
                status: 'ditolak'
            }, { transaction });

            // 4. Simpan riwayat penolakan
            await db.OrderStatusHistory.create({
                orderId: order.id,
                status: 'ditolak',
                keterangan: 'Penjual menolak pesanan.',
                changedBy: userId
            }, { transaction });

        });

        return res.redirect('/seller/dashboard');

    } catch (err) {
        console.error('Error menolak pesanan:', err);

        return res.status(400).send(
            'Gagal menolak pesanan: ' + err.message
        );
    }
});


router.post('/seller/orders/:id/ship', isPenjual, async (req, res) => {
    const db = require('../models');

    try {
        await db.sequelize.transaction(async (transaction) => {

            // Cari toko milik penjual yang sedang login
            const store = await db.StoreProfile.findOne({
                where: {
                    userId: req.session.userId
                },
                transaction
            });

            if (!store) {
                throw new Error('Profil toko tidak ditemukan.');
            }

            // Cari dan kunci pesanan milik toko tersebut
            const order = await db.Order.findOne({
                where: {
                    id: req.params.id,
                    storeId: store.id
                },
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!order) {
                throw new Error('Pesanan tidak ditemukan.');
            }

            // Pastikan pesanan sudah diterima dan sedang diproses
            if (order.status !== 'diproses') {
                throw new Error('Pesanan tidak dapat dikirim pada status saat ini.');
            }

            // Ubah status pesanan
            await order.update({
                status: 'dikirim'
            }, {
                transaction
            });

            // Simpan riwayat perubahan status
            await db.OrderStatusHistory.create({
                orderId: order.id,
                status: 'dikirim',
                keterangan: 'Pesanan telah dikirim oleh penjual.',
                changedBy: req.session.userId
            }, {
                transaction
            });

        });

        res.redirect('/seller/dashboard');

    } catch (err) {
        console.error('Error mengirim pesanan:', err);
        res.status(400).send('Gagal melanjutkan pesanan: ' + err.message);
    }
});


router.post('/buyer/orders/:id/received', async (req, res) => {
    const db = require('../models');

    // Pastikan pengguna adalah pembeli yang sudah login
    if (!req.session.userId || req.session.role !== 'pembeli') {
        return res.status(403).send('Akses hanya untuk pembeli.');
    }

    try {
        await db.sequelize.transaction(async (transaction) => {

            // Cari pesanan milik pembeli yang sedang login
            const order = await db.Order.findOne({
                where: {
                    id: req.params.id,
                    buyerId: req.session.userId
                },
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!order) {
                throw new Error('Pesanan tidak ditemukan.');
            }

            // Pastikan pesanan memang sudah dikirim
            if (order.status !== 'dikirim') {
                throw new Error('Pesanan belum berstatus dikirim.');
            }

            // Ubah status menjadi selesai
            await order.update({
                status: 'selesai'
            }, {
                transaction
            });

            // Simpan riwayat perubahan status
            await db.OrderStatusHistory.create({
                orderId: order.id,
                status: 'selesai',
                keterangan: 'Pembeli mengonfirmasi bahwa pesanan sudah sampai.',
                changedBy: req.session.userId
            }, {
                transaction
            });

        });

        res.redirect('/dashboard');

    } catch (err) {
        console.error('Error konfirmasi pesanan:', err);
        res.status(400).send('Gagal mengonfirmasi pesanan: ' + err.message);
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
            rotis,
            userRole: req.session?.role || null
        });

    } catch (err) {
        console.error('Error loading store detail:', err.message);
        res.status(500).send('Server Error: ' + err.message);
    }
});

router.post('/toko/:id/checkout', isPembeli, async (req, res) => {
    const db = require('../models');

    try {
        const storeId = Number(req.params.id);
        const buyerId = req.session.userId;

        // 1. Pastikan toko tersedia
        const store = await db.StoreProfile.findByPk(storeId);

        if (!store) {
            return res.status(404).send('Toko tidak ditemukan.');
        }

        // 2. Ambil seluruh jumlah produk dari form
        const selectedItems = Object.entries(req.body)
            .filter(([key]) => key.startsWith('jumlah_'))
            .map(([key, value]) => ({
                rotiId: Number(key.replace('jumlah_', '')),
                jumlah: Number(value)
            }))
            .filter(item =>
                Number.isInteger(item.rotiId) &&
                Number.isInteger(item.jumlah) &&
                item.jumlah > 0
            );

        if (selectedItems.length === 0) {
            return res.status(400).send(
                'Pilih minimal satu produk untuk dipesan.'
            );
        }

        // 3. Proses pesanan menggunakan database transaction
        const order = await db.sequelize.transaction(async (transaction) => {

            const rotiIds = selectedItems.map(item => item.rotiId);

            // Ambil produk yang benar-benar berasal dari toko tersebut
            const rotis = await db.Roti.findAll({
                where: {
                    id: rotiIds,
                    storeId: storeId
                },
                transaction
            });

            if (rotis.length !== selectedItems.length) {
                throw new Error(
                    'Terdapat produk yang tidak valid atau bukan milik toko ini.'
                );
            }

            const rotiMap = new Map(
                rotis.map(roti => [Number(roti.id), roti])
            );

            let totalHarga = 0;
            const orderItems = [];

            // 4. Validasi stok dan hitung total harga
            for (const item of selectedItems) {
                const roti = rotiMap.get(item.rotiId);

                if (!roti) {
                    throw new Error('Produk tidak ditemukan.');
                }

                if (item.jumlah > Number(roti.stok)) {
                    throw new Error(
                        `Stok ${roti.nama} tidak mencukupi.`
                    );
                }

                const harga = Number(roti.harga);
                const subtotal = harga * item.jumlah;

                totalHarga += subtotal;

                orderItems.push({
                    rotiId: roti.id,
                    namaProduk: roti.nama,
                    harga: harga,
                    jumlah: item.jumlah,
                    subtotal: subtotal
                });
            }

            // 5. Buat data pesanan utama
            const newOrder = await db.Order.create({
                buyerId,
                storeId,
                totalHarga,
                status: 'menunggu_konfirmasi'
            }, { transaction });

            // 6. Simpan rincian produk pesanan
            await db.OrderItem.bulkCreate(
                orderItems.map(item => ({
                    ...item,
                    orderId: newOrder.id
                })),
                { transaction }
            );

            // 7. Simpan riwayat status pertama
            await db.OrderStatusHistory.create({
                orderId: newOrder.id,
                status: 'menunggu_konfirmasi',
                keterangan: 'Pesanan berhasil dibuat oleh pembeli.',
                changedBy: buyerId
            }, { transaction });

            return newOrder;
        });

            return res.status(201).render('checkout-success', {
                order,
                store
        });

    } catch (err) {
        console.error('Error checkout:', err);

        return res.status(400).send(
            'Checkout gagal: ' + err.message
        );
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