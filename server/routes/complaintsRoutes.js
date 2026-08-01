const express = require('express');
const router = express.Router();
const complaintsController = require('../controllers/complaintsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');
const upload = require('../middleware/upload');

router.use(authMiddleware);

router.post('/', roleGuard(['owner', 'tenant']), upload.array('attachments', 5), complaintsController.create);
router.get('/', roleGuard(['admin', 'manager', 'owner', 'tenant']), complaintsController.getAll);
router.get('/:id', roleGuard(['admin', 'manager', 'owner', 'tenant']), complaintsController.getById);
router.put('/:id/status', roleGuard(['manager']), complaintsController.updateStatus);

module.exports = router;
