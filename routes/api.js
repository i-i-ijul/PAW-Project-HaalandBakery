const express = require('express');
const router = express.Router();
const { getStatus } = require("../controllers/apiController");

const { 
    getAllRoti, 
    getRotiById, 
    createRoti, 
    updateRoti, 
    deleteRoti 
} = require('../controllers/apiController');

router.get("/status", getStatus);
router.get('/produk', getAllRoti);
router.get('/server', getAllRoti);
router.get('/produk/:id', getRotiById);
router.post('/produk', createRoti);
router.put('/produk/:id', updateRoti);
router.delete('/produk/:id', deleteRoti);

module.exports = router;