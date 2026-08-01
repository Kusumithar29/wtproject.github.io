const express = require('express');
const router = express.Router();
const waterController = require('../controllers/waterController');
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

router.use(authMiddleware);

router.get('/', roleGuard(['admin', 'manager', 'owner', 'tenant']), waterController.getAll);
router.post('/', roleGuard(['manager']), waterController.create);
router.get('/flat/:flatNumber', roleGuard(['admin', 'manager']), waterController.getByFlatNumber);

module.exports = router;
