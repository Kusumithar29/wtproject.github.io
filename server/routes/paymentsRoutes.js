const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/paymentsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

router.use(authMiddleware);

router.post('/initiate', roleGuard(['tenant']), paymentsController.initiate);
router.post('/confirm', roleGuard(['tenant']), paymentsController.confirm);
router.get('/all', roleGuard(['admin']), paymentsController.getAll);
router.get('/history', roleGuard(['admin', 'owner', 'tenant']), paymentsController.getHistory);
router.get('/pending', roleGuard(['admin', 'owner']), paymentsController.getPending);

module.exports = router;
