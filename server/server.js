// Mock mongoose globally before any other imports
const Module = require('module');
const path = require('path');
const originalRequire = Module.prototype.require;
const mockMongoosePath = path.join(__dirname, 'config', 'mockMongoose.js');
Module.prototype.require = function(id) {
  if (id === 'mongoose') {
    return originalRequire.call(this, mockMongoosePath);
  }
  return originalRequire.apply(this, arguments);
};

require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const socketHandler = require('./socket/socketHandler');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const usersRoutes = require('./routes/usersRoutes');
const flatsRoutes = require('./routes/flatsRoutes');
const complaintsRoutes = require('./routes/complaintsRoutes');
const paymentsRoutes = require('./routes/paymentsRoutes');
const noticesRoutes = require('./routes/noticesRoutes');
const parkingRoutes = require('./routes/parkingRoutes');
const waterRoutes = require('./routes/waterRoutes');
const messagesRoutes = require('./routes/messagesRoutes');
const visitorsRoutes = require('./routes/visitorsRoutes');
const servicesRoutes = require('./routes/servicesRoutes');

// Initialize app
const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = socketIo(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
  }
});

// Share socketio instance with routes
app.set('socketio', io);
socketHandler(io);

// Connect to Database
connectDB();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false // Allows static uploads to be loaded in browser
}));

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Rate limiting on Login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  message: { message: 'Too many login attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/auth/login', loginLimiter);

// Serve static upload folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/flats', flatsRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/notices', noticesRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/visitors', visitorsRoutes);
app.use('/api/services', servicesRoutes);

// Root route (for API check)
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to VastuSetu API' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
