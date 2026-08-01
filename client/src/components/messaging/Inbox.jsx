import React, { useState, useEffect, useRef } from 'react';
import useAuth from '../../hooks/useAuth';
import useSocket from '../../hooks/useSocket';
import axiosInstance from '../../api/axiosInstance';
import { formatTime } from '../../utils/formatters';
import { 
  Send, 
  MessageSquare, 
  UserPlus, 
  Search, 
  X,
  Check,
  CheckCheck
} from 'lucide-react';

const Inbox = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null); // The other user in active chat
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Modals & Search
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerUsers, setPickerUsers] = useState([]);
  const [pickerSearch, setPickerSearch] = useState('');
  const [threadSearch, setThreadSearch] = useState('');

  const messagesEndRef = useRef(null);

  // Expose colors based on roles for rendering badges
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'manager':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'owner':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'tenant':
      default:
        return 'bg-teal-100 text-teal-800 border-teal-200';
    }
  };

  // Fetch Conversation threads
  const fetchConversations = async () => {
    try {
      const res = await axiosInstance.get('/messages/conversations');
      if (res.data.success) {
        setConversations(res.data.conversations);
      }
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    }
  };

  // Fetch Full chat thread
  const fetchChatHistory = async (otherId) => {
    try {
      const res = await axiosInstance.get(`/messages/${otherId}`);
      if (res.data.success) {
        setMessages(res.data.messages);
        scrollToBottom();
      }
    } catch (err) {
      console.error('Failed to fetch chat history', err);
    }
  };

  // Mark conversations as read
  const markAsRead = async (otherId) => {
    try {
      await axiosInstance.put(`/messages/${otherId}/read`);
      // Update local state
      setConversations(prev => 
        prev.map(c => 
          c.otherUser._id === otherId ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  // Setup Initial load
  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch picker list
  useEffect(() => {
    if (pickerOpen) {
      const getPickerUsers = async () => {
        try {
          const res = await axiosInstance.get('/messages/users/picker');
          if (res.data.success) {
            setPickerUsers(res.data.users);
          }
        } catch (err) {
          console.error(err);
        }
      };
      getPickerUsers();
    }
  }, [pickerOpen]);

  // Handle active chat changes
  useEffect(() => {
    if (activeUser) {
      fetchChatHistory(activeUser._id);
      markAsRead(activeUser._id);
    }
  }, [activeUser]);

  // Socket event listener
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg) => {
      // If message is from current active conversation, append it
      if (activeUser && (msg.senderId._id === activeUser._id || msg.senderId === activeUser._id)) {
        setMessages(prev => [...prev, msg]);
        markAsRead(activeUser._id);
      } else {
        // Otherwise re-fetch conversation list to update lastMessage and unread badge
        fetchConversations();
      }
      scrollToBottom();
    };

    const handleUnreadCountUpdate = () => {
      fetchConversations();
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('unread-count', handleUnreadCountUpdate);

    return () => {
      socket.off('receive-message', handleReceiveMessage);
      socket.off('unread-count', handleUnreadCountUpdate);
    };
  }, [socket, activeUser]);

  // Auto-scroll helper
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Handle sending message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeUser) return;

    const content = newMessage.trim();
    setNewMessage('');

    try {
      const res = await axiosInstance.post('/messages', {
        receiverId: activeUser._id,
        content
      });

      if (res.data.success) {
        const sentMsg = res.data.message;
        setMessages(prev => [...prev, sentMsg]);
        scrollToBottom();
        
        // Refresh conversation threads list
        fetchConversations();
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const handleStartNewChat = (selectedUser) => {
    setActiveUser(selectedUser);
    setPickerOpen(false);
    
    // Check if conversation already exists in thread
    const exists = conversations.find(c => c.otherUser._id === selectedUser._id);
    if (!exists) {
      setConversations(prev => [
        {
          otherUser: selectedUser,
          lastMessage: { content: 'No messages yet.', createdAt: new Date() },
          unreadCount: 0
        },
        ...prev
      ]);
    }
  };

  // Filter conversations list
  const filteredConversations = conversations.filter(c => 
    c.otherUser.name.toLowerCase().includes(threadSearch.toLowerCase()) ||
    c.otherUser.role.toLowerCase().includes(threadSearch.toLowerCase())
  );

  // Filter user picker list
  const filteredPickerUsers = pickerUsers.filter(u => 
    u.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-[calc(100vh-180px)] flex flex-col md:flex-row relative">
      
      {/* LEFT PANEL: CHAT LIST */}
      <div className="w-full md:w-80 border-r border-gray-100 flex flex-col h-full flex-shrink-0">
        <div className="p-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-md font-bold text-gray-800">Messages</h2>
          <button
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-gray-50 bg-gray-50/20">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search chat..."
              value={threadSearch}
              onChange={(e) => setThreadSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 focus:border-indigo-200 focus:bg-white rounded-xl text-xs outline-none transition-all"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-grow overflow-y-auto p-2 space-y-1">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const isActive = activeUser && activeUser._id === conv.otherUser._id;
              const hasUnread = conv.unreadCount > 0;
              return (
                <button
                  key={conv.otherUser._id}
                  onClick={() => setActiveUser(conv.otherUser)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-indigo-50/60 shadow-sm shadow-indigo-50' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                    {conv.otherUser.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Thread Details */}
                  <div className="flex-grow text-left min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className="text-xs font-semibold text-gray-800 truncate pr-2">{conv.otherUser.name}</p>
                      <span className="text-[9px] text-gray-400 flex-shrink-0">
                        {conv.lastMessage?.createdAt ? formatTime(conv.lastMessage.createdAt) : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-[11px] truncate max-w-[130px] ${hasUnread ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
                        {conv.lastMessage?.content || ''}
                      </p>
                      {hasUnread && (
                        <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded border font-medium mt-1 uppercase ${getRoleBadgeClass(conv.otherUser.role)}`}>
                      {conv.otherUser.role}
                    </span>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <MessageSquare className="w-8 h-8 mb-2 text-gray-300" />
              <p className="text-xs font-medium">No active chats found</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: CHAT WINDOW */}
      <div className="flex-grow flex flex-col h-full bg-gray-50/30">
        {activeUser ? (
          <>
            {/* Header */}
            <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm">
                {activeUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-800 leading-none">{activeUser.name}</h3>
                <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded border font-medium uppercase mt-1 ${getRoleBadgeClass(activeUser.role)}`}>
                  {activeUser.role}
                </span>
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-grow overflow-y-auto p-4 space-y-3">
              {messages.map((msg, index) => {
                const isMe = msg.senderId === user._id || (msg.senderId._id && msg.senderId._id === user._id);
                return (
                  <div key={msg._id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[70%]">
                      <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        isMe 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                      }`}>
                        <p>{msg.content}</p>
                      </div>
                      <div className={`flex items-center gap-1 mt-1 text-[9px] text-gray-400 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span>{formatTime(msg.createdAt)}</span>
                        {isMe && (
                          msg.read ? <CheckCheck className="w-3.5 h-3.5 text-blue-500" /> : <Check className="w-3.5 h-3.5 text-gray-300" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-grow px-4 py-2.5 bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-300 rounded-xl text-xs outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-40 disabled:hover:bg-indigo-600 flex items-center justify-center flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-8 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-3 shadow-inner">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-gray-700 mb-1">Select a conversation</h3>
            <p className="text-xs max-w-xs leading-normal">
              Click on an existing message thread on the left panel or start a new chat with VastuSetu members.
            </p>
          </div>
        )}
      </div>

      {/* USER PICKER MODAL */}
      {pickerOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-100 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">New Conversation</h3>
              <button
                onClick={() => setPickerOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Picker Search */}
            <div className="p-3 border-b border-gray-50 bg-gray-50/40">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search members by name or role..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-100 focus:border-indigo-300 rounded-xl text-xs bg-white outline-none transition-all"
                />
              </div>
            </div>

            {/* User List */}
            <div className="flex-grow overflow-y-auto p-2 space-y-1">
              {filteredPickerUsers.length > 0 ? (
                filteredPickerUsers.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => handleStartNewChat(u)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-gray-800">{u.name}</p>
                      <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded border font-medium uppercase mt-0.5 ${getRoleBadgeClass(u.role)}`}>
                        {u.role}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <p className="text-xs font-medium">No users match your search</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inbox;
