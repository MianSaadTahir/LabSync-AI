'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { MessageItem } from '@/types/message';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export interface SocketEventData {
  message?: MessageItem;
  messageId?: string;
  module1_status?: string;
  module2_status?: string;
  module3_status?: string;
  meeting?: any;
  budget?: any;
  meetingId?: string;
}

export interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  latestMessage: MessageItem | null;
  onMessageCreated: (callback: (data: SocketEventData) => void) => void;
  onStatusUpdated: (callback: (data: SocketEventData) => void) => void;
  onMeetingExtracted: (callback: (data: SocketEventData) => void) => void;
  onBudgetDesigned: (callback: (data: SocketEventData) => void) => void;
  onBudgetAllocated: (callback: (data: SocketEventData) => void) => void;
}

export function useSocket(): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestMessage, setLatestMessage] = useState<MessageItem | null>(null);
  const callbacksRef = useRef<{
    messageCreated: ((data: SocketEventData) => void)[];
    statusUpdated: ((data: SocketEventData) => void)[];
    meetingExtracted: ((data: SocketEventData) => void)[];
    budgetDesigned: ((data: SocketEventData) => void)[];
    budgetAllocated: ((data: SocketEventData) => void)[];
  }>({
    messageCreated: [],
    statusUpdated: [],
    meetingExtracted: [],
    budgetDesigned: [],
    budgetAllocated: [],
  });

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected to server');
      setIsConnected(true);
      // Subscribe to updates
      newSocket.emit('subscribe:updates');
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
      setIsConnected(false);
    });

    // Listen for events
    newSocket.on('message:created', (data: SocketEventData) => {
      console.log('[Socket] Message created:', data);
      if (data.message) {
        setLatestMessage(data.message);
      }
      callbacksRef.current.messageCreated.forEach((cb) => cb(data));
    });

    newSocket.on('message:status:updated', (data: SocketEventData) => {
      console.log('[Socket] Status updated:', data);
      if (data.message) {
        setLatestMessage(data.message);
      }
      callbacksRef.current.statusUpdated.forEach((cb) => cb(data));
    });

    newSocket.on('meeting:extracted', (data: SocketEventData) => {
      console.log('[Socket] Meeting extracted:', data);
      callbacksRef.current.meetingExtracted.forEach((cb) => cb(data));
    });

    newSocket.on('budget:designed', (data: SocketEventData) => {
      console.log('[Socket] Budget designed:', data);
      callbacksRef.current.budgetDesigned.forEach((cb) => cb(data));
    });

    newSocket.on('budget:allocated', (data: SocketEventData) => {
      console.log('[Socket] Budget allocated:', data);
      callbacksRef.current.budgetAllocated.forEach((cb) => cb(data));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const onMessageCreated = useCallback((callback: (data: SocketEventData) => void): (() => void) => {
    callbacksRef.current.messageCreated.push(callback);
    return () => {
      const index = callbacksRef.current.messageCreated.indexOf(callback);
      if (index > -1) {
        callbacksRef.current.messageCreated.splice(index, 1);
      }
    };
  }, []);

  const onStatusUpdated = useCallback((callback: (data: SocketEventData) => void): (() => void) => {
    callbacksRef.current.statusUpdated.push(callback);
    return () => {
      const index = callbacksRef.current.statusUpdated.indexOf(callback);
      if (index > -1) {
        callbacksRef.current.statusUpdated.splice(index, 1);
      }
    };
  }, []);

  const onMeetingExtracted = useCallback((callback: (data: SocketEventData) => void): (() => void) => {
    callbacksRef.current.meetingExtracted.push(callback);
    return () => {
      const index = callbacksRef.current.meetingExtracted.indexOf(callback);
      if (index > -1) {
        callbacksRef.current.meetingExtracted.splice(index, 1);
      }
    };
  }, []);

  const onBudgetDesigned = useCallback((callback: (data: SocketEventData) => void): (() => void) => {
    callbacksRef.current.budgetDesigned.push(callback);
    return () => {
      const index = callbacksRef.current.budgetDesigned.indexOf(callback);
      if (index > -1) {
        callbacksRef.current.budgetDesigned.splice(index, 1);
      }
    };
  }, []);

  const onBudgetAllocated = useCallback((callback: (data: SocketEventData) => void): (() => void) => {
    callbacksRef.current.budgetAllocated.push(callback);
    return () => {
      const index = callbacksRef.current.budgetAllocated.indexOf(callback);
      if (index > -1) {
        callbacksRef.current.budgetAllocated.splice(index, 1);
      }
    };
  }, []);

  return {
    socket,
    isConnected,
    latestMessage,
    onMessageCreated,
    onStatusUpdated,
    onMeetingExtracted,
    onBudgetDesigned,
    onBudgetAllocated,
  };
}

