// src/contexts/WebSocketContext.jsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const { isAuthenticated, admin } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (isAuthenticated && admin) {
      initializeSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, admin]);

  const initializeSocket = () => {
    try {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
      
      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('WebSocket connected:', newSocket.id);
        setIsConnected(true);
        reconnectAttempts.current = 0;

        // Join admin room for real-time updates
        newSocket.emit('join-admin', {
          adminId: admin.id,
          name: admin.name,
          role: admin.role
        });

        toast.success('Connected to real-time updates', {
          position: 'bottom-right',
          autoClose: 2000
        });
      });

      newSocket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setIsConnected(false);

        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          newSocket.connect();
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        reconnectAttempts.current++;
        
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          toast.error('Unable to connect to real-time updates', {
            position: 'bottom-right'
          });
        }
      });

      // Admin-specific event handlers
      newSocket.on('admin-login', (data) => {
        if (data.adminName !== admin.name) {
          addNotification({
            id: Date.now(),
            type: 'admin-login',
            title: 'Admin Login',
            message: `${data.adminName} has logged in`,
            timestamp: data.timestamp,
            icon: 'ri-user-line',
            color: 'green'
          });
        }
      });

      newSocket.on('admin-logout', (data) => {
        if (data.adminName !== admin.name) {
          addNotification({
            id: Date.now(),
            type: 'admin-logout',
            title: 'Admin Logout',
            message: `${data.adminName} has logged out`,
            timestamp: data.timestamp,
            icon: 'ri-user-line',
            color: 'gray'
          });
        }
      });

      newSocket.on('member-added', (data) => {
        addNotification({
          id: Date.now(),
          type: 'member-added',
          title: 'New Member',
          message: `${data.memberName} has been added`,
          timestamp: data.timestamp,
          icon: 'ri-user-add-line',
          color: 'blue'
        });
      });

      newSocket.on('event-created', (data) => {
        addNotification({
          id: Date.now(),
          type: 'event-created',
          title: 'New Event',
          message: `${data.eventTitle} has been created`,
          timestamp: data.timestamp,
          icon: 'ri-calendar-event-line',
          color: 'purple'
        });
      });

      newSocket.on('celebration-submitted', (data) => {
        addNotification({
          id: Date.now(),
          type: 'celebration-submitted',
          title: 'New Celebration',
          message: `${data.celebrationName} celebration submitted`,
          timestamp: data.timestamp,
          icon: 'ri-cake-3-line',
          color: 'yellow'
        });
      });

      newSocket.on('attendance-recorded', (data) => {
        addNotification({
          id: Date.now(),
          type: 'attendance-recorded',
          title: 'Attendance Recorded',
          message: `${data.serviceType} attendance: ${data.totalAttendance} people`,
          timestamp: data.timestamp,
          icon: 'ri-calendar-check-line',
          color: 'green'
        });
      });

      // System notifications
      newSocket.on('system-notification', (data) => {
        addNotification({
          id: Date.now(),
          type: 'system',
          title: data.title,
          message: data.message,
          timestamp: data.timestamp,
          icon: data.icon || 'ri-notification-line',
          color: data.color || 'blue'
        });

        // Show toast for important system notifications
        if (data.priority === 'high') {
          toast.info(data.message, {
            position: 'top-right'
          });
        }
      });

      // Data refresh events
      newSocket.on('refresh-dashboard', () => {
        // Trigger dashboard data refresh
        window.dispatchEvent(new CustomEvent('refresh-dashboard'));
      });

      newSocket.on('refresh-members', () => {
        // Trigger members data refresh
        window.dispatchEvent(new CustomEvent('refresh-members'));
      });

      newSocket.on('refresh-events', () => {
        // Trigger events data refresh
        window.dispatchEvent(new CustomEvent('refresh-events'));
      });

      newSocket.on('refresh-attendance', () => {
        // Trigger attendance data refresh
        window.dispatchEvent(new CustomEvent('refresh-attendance'));
      });

      newSocket.on('refresh-celebrations', () => {
        // Trigger celebrations data refresh
        window.dispatchEvent(new CustomEvent('refresh-celebrations'));
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Error initializing socket:', error);
    }
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50 notifications
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const emitEvent = (eventName, data) => {
    if (socket && isConnected) {
      socket.emit(eventName, data);
      return true;
    }
    return false;
  };

  // Subscribe to custom events
  const subscribeToEvent = (eventName, callback) => {
    if (socket) {
      socket.on(eventName, callback);
      return () => socket.off(eventName, callback);
    }
    return () => {};
  };

  const value = {
    socket,
    isConnected,
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    emitEvent,
    subscribeToEvent,
    reconnect: initializeSocket,
    disconnect: disconnectSocket
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// Custom hook for specific data subscriptions
export const useRealtimeData = (dataType) => {
  const { subscribeToEvent } = useWebSocket();
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToEvent(`refresh-${dataType}`, () => {
      setLastUpdate(new Date());
    });

    return unsubscribe;
  }, [dataType, subscribeToEvent]);

  return lastUpdate;
};

// Custom hook for notifications
export const useNotifications = () => {
  const { notifications, removeNotification, clearAllNotifications } = useWebSocket();
  
  const unreadCount = notifications.length;
  const recentNotifications = notifications.slice(0, 10);

  return {
    notifications: recentNotifications,
    allNotifications: notifications,
    unreadCount,
    removeNotification,
    clearAllNotifications
  };
};