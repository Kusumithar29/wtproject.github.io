const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');
const { signupRules, validate } = require('../middleware/validation');

// All routes require auth
router.use(authMiddleware);

router.get('/', roleGuard(['admin', 'manager']), usersController.getAll);
router.post('/', roleGuard(['admin']), signupRules, validate, usersController.create);
router.get('/:id', roleGuard(['admin', 'manager']), usersController.getById);
router.put('/:id', roleGuard(['admin']), usersController.update);
router.delete('/:id', roleGuard(['admin']), usersController.delete);

module.exports = router;
