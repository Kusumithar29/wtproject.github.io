const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { loginRules, signupRules, validate } = require('../middleware/validation');

router.post('/login', loginRules, validate, authController.login);
router.post('/register', signupRules, validate, authController.register);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
