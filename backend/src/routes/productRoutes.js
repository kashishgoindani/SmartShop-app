const express = require('express');
const router = express.Router();
const { getProducts, addProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', auth, getProducts);
router.post('/', auth, adminOnly, addProduct);
router.put('/:id', auth, adminOnly, updateProduct);
router.delete('/:id', auth, adminOnly, deleteProduct);

module.exports = router;