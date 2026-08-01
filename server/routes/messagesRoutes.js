const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messagesController');
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

router.use(authMiddleware);
router.use(roleGuard(['admin', 'manager', 'owner', 'tenant']));

router.get('/conversations', messagesController.getConversations);
router.get('/users/picker', messagesController.getUserPicker);
router.get('/:userId', messagesController.getChatHistory);
router.post('/', messagesController.sendMessage);
router.put('/:userId/read', messagesController.markAsRead);

module.exports = router;
