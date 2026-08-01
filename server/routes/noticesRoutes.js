const express = require('express');
const router = express.Router();
const noticesController = require('../controllers/noticesController');
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

router.use(authMiddleware);

router.post('/', roleGuard(['admin', 'manager']), noticesController.create);
router.get('/', roleGuard(['admin', 'manager', 'owner', 'tenant']), noticesController.getAll);
router.delete('/:id', roleGuard(['admin', 'manager']), noticesController.delete);

module.exports = router;
