const express = require('express');
const router = express.Router();
const flatsController = require('../controllers/flatsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

router.use(authMiddleware);

router.get('/', roleGuard(['admin', 'manager', 'owner', 'tenant']), flatsController.getAll);
router.get('/:flatNumber', roleGuard(['admin', 'manager', 'owner', 'tenant']), flatsController.getByFlatNumber);

router.post('/', roleGuard(['admin']), flatsController.create);
router.put('/:flatNumber', roleGuard(['admin']), flatsController.update);

module.exports = router;
