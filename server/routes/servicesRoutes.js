const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/servicesController');
const authMiddleware = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// Secure all endpoints
router.use(authMiddleware);

// Get available services (accessible by everyone authenticated)
router.get('/available', servicesController.getAvailableServices);

// Owner/Tenant service requests
router.get('/my-requests', roleGuard(['owner', 'tenant']), servicesController.getMyRequests);
router.post('/requests', roleGuard(['owner', 'tenant']), servicesController.createRequest);

// Admin/Manager service request management
router.get('/requests', roleGuard(['admin', 'manager']), servicesController.getAllRequests);
router.put('/requests/:id', roleGuard(['admin', 'manager']), servicesController.updateRequest);

module.exports = router;
