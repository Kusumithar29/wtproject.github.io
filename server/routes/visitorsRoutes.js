const express = require('express');
const router = express.Router();
const visitorsController = require('../controllers/visitorsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// Secure all endpoints
router.use(authMiddleware);

// Only manager and admin can monitor and register visitors
router.get('/', roleGuard(['admin', 'manager']), visitorsController.getAllVisitors);
router.post('/', roleGuard(['admin', 'manager']), visitorsController.createVisitor);
router.put('/:id/checkout', roleGuard(['admin', 'manager']), visitorsController.checkoutVisitor);

module.exports = router;
