const Notice = require('../models/Notice');

exports.create = async (req, res, next) => {
  try {
    const { title, body, audience } = req.body;
    const postedBy = req.user._id;

    const notice = await Notice.create({
      title,
      body,
      audience,
      postedBy
    });

    const populatedNotice = await Notice.findById(notice._id)
      .populate('postedBy', 'name role');

    // Broadcast new notice to all connected clients via Socket.io
    const io = req.app.get('socketio');
    if (io) {
      io.emit('new-notice', populatedNotice);
    }

    res.status(201).json({ success: true, notice: populatedNotice });
  } catch (error) {
    next(error);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const role = req.user.role;
    let query = {};

    if (role === 'owner') {
      query.audience = { $in: ['all', 'owners'] };
    } else if (role === 'tenant') {
      query.audience = { $in: ['all', 'tenants'] };
    }

    const notices = await Notice.find(query)
      .populate('postedBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, notices });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const noticeId = req.params.id;
    const notice = await Notice.findById(noticeId);

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    const postedById = String(notice.postedBy?._id || notice.postedBy);
    if (req.user.role !== 'admin' && postedById !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access Denied: You can only delete your own notices' });
    }

    await Notice.findByIdAndDelete(noticeId);

    res.status(200).json({ success: true, message: 'Notice deleted successfully' });
  } catch (error) {
    next(error);
  }
};
