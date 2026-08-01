const jwt = require('jsonwebtoken');
const Message = require('../models/Message');

const socketHandler = (io) => {
  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers['x-auth-token'];
    
    if (!token) {
      return next(new Error('Authentication error: Access Token missing'));
    }

    try {
      // Remove 'Bearer ' prefix if present
      const cleanToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
      const decoded = jwt.verify(cleanToken, process.env.JWT_ACCESS_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Access Token invalid'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket Connected: ${socket.id} (User: ${socket.user._id}, Role: ${socket.user.role})`);

    // Handle joining private room
    socket.on('join-room', (userId) => {
      // Security check: Only allow users to join their own room
      if (socket.user._id.toString() === userId.toString()) {
        socket.join(userId.toString());
        console.log(`🏠 User room joined: ${userId}`);
      }
    });

    // Handle sending a message directly through sockets
    socket.on('send-message', async (data) => {
      const { receiverId, content } = data;
      const senderId = socket.user._id;

      try {
        if (!receiverId || !content) return;

        const message = await Message.create({
          senderId,
          receiverId,
          content
        });

        const populatedMessage = await Message.findById(message._id)
          .populate('senderId', 'name role')
          .populate('receiverId', 'name role');

        // Emit to receiver room
        io.to(receiverId.toString()).emit('receive-message', populatedMessage);
        
        // Emit to sender room
        socket.emit('receive-message', populatedMessage);

        // Update unread count for receiver
        const unreadCount = await Message.countDocuments({
          receiverId,
          read: false
        });
        
        io.to(receiverId.toString()).emit('unread-count', { unreadCount });
      } catch (err) {
        console.error('Socket message error:', err);
        socket.emit('message-error', { error: 'Failed to deliver message' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket Disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;
