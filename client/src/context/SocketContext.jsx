import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context;
};

export const SocketProvider = ({ children }) => {
  const { accessToken, user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!accessToken || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    // Connect using token in handshake
    const socketInstance = io(socketUrl, {
      auth: {
        token: accessToken
      },
      autoConnect: true
    });

    socketInstance.on('connect', () => {
      console.log('🔌 Connected to real-time notification socket');
      // Join personal user room
      socketInstance.emit('join-room', user._id);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [accessToken, user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
