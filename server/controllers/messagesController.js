const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

exports.getConversations = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    // Aggregate to get the last message for each conversation
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', userId] },
              '$receiverId',
              '$senderId'
            ]
          },
          lastMessage: { $first: '$$ROOT' }
        }
      }
    ]);

    const populatedConversations = [];

    for (const conv of conversations) {
      const otherUser = await User.findById(conv._id).select('name role');
      if (!otherUser) continue;

      const unreadCount = await Message.countDocuments({
        senderId: conv._id,
        receiverId: userId,
        read: false
      });

      populatedConversations.push({
        otherUser,
        lastMessage: conv.lastMessage,
        unreadCount
      });
    }

    // Sort by last message date desc
    populatedConversations.sort((a, b) => b.lastMessage.createdAt - a.lastMessage.createdAt);

    res.status(200).json({ success: true, conversations: populatedConversations });
  } catch (error) {
    next(error);
  }
};

exports.getChatHistory = async (req, res, next) => {
  try {
    const myId = req.user._id;
    const otherId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherId },
        { senderId: otherId, receiverId: myId }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const senderId = req.user._id;
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receiver and content are required' });
    }

    const message = await Message.create({
      senderId,
      receiverId,
      content
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name role')
      .populate('receiverId', 'name role');

    // Socket.io emit
    const io = req.app.get('socketio');
    if (io) {
      // Emit to receiver
      io.to(receiverId.toString()).emit('receive-message', populatedMessage);
      
      // Also emit updated unread counts to the receiver
      const unreadCount = await Message.countDocuments({
        receiverId,
        read: false
      });
      io.to(receiverId.toString()).emit('unread-count', { unreadCount });
    }

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const myId = req.user._id;
    const otherId = req.params.userId;

    await Message.updateMany(
      { senderId: otherId, receiverId: myId, read: false },
      { $set: { read: true } }
    );

    const io = req.app.get('socketio');
    if (io) {
      // Emit to my room that my unread count has changed
      const unreadCount = await Message.countDocuments({
        receiverId: myId,
        read: false
      });
      io.to(myId.toString()).emit('unread-count', { unreadCount });
    }

    res.status(200).json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};

exports.getUserPicker = async (req, res, next) => {
  try {
    // Return all users: name + role only — no flat number, no email
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('name role');
    
    res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};
