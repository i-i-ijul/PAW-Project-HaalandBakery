const express = require('express');
const router = express.Router();
const { 
    getStatus,
    getAllRoti, 
    getRotiById, 
    createRoti, 
    updateRoti, 
    deleteRoti,
    generateCaption // <-- Pastikan fungsi ini nanti ada di apiController
} = require("../controllers/apiController");

router.get("/status", getStatus);
router.get('/produk', getAllRoti);
router.get('/server', getAllRoti);
router.get('/produk/:id', getRotiById);
router.post('/produk', createRoti);
router.put('/produk/:id', updateRoti);
router.delete('/produk/:id', deleteRoti);

// TAMBAHKAN RUTE AI INI DI BAWAHNYA:
router.post('/chat', generateCaption);

module.exports = router;