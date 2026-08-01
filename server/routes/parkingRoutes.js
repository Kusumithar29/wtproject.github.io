const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

router.use(authMiddleware);

router.get('/', roleGuard(['admin', 'manager', 'owner', 'tenant']), parkingController.getAll);
router.post('/assign', roleGuard(['manager']), parkingController.assign);
router.put('/:slotNumber', roleGuard(['manager']), parkingController.update);
router.delete('/:slotNumber/release', roleGuard(['manager']), parkingController.release);

module.exports = router;
