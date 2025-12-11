import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.io server
 */
export function initializeSocket(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });

    // Join room for real-time updates
    socket.on('subscribe:updates', () => {
      socket.join('updates');
      console.log(`[Socket] Client ${socket.id} subscribed to updates`);
    });
  });

  console.log('[Socket] Socket.io server initialized');
  return io;
}

/**
 * Get the Socket.io server instance
 */
export function getSocketIO(): SocketIOServer | null {
  return io;
}

/**
 * Emit event to all connected clients
 */
export function emitEvent(event: string, data: any): void {
  if (io) {
    io.emit(event, data);
    console.log(`[Socket] Emitted event: ${event}`, data);
  }
}

/**
 * Emit event to clients in the updates room
 */
export function emitToUpdates(event: string, data: any): void {
  if (io) {
    io.to('updates').emit(event, data);
    console.log(`[Socket] Emitted to updates room: ${event}`, data);
  }
}

/**
 * Socket event types
 */
export const SocketEvents = {
  MESSAGE_CREATED: 'message:created',
  MESSAGE_STATUS_UPDATED: 'message:status:updated',
  MEETING_EXTRACTED: 'meeting:extracted',
  BUDGET_DESIGNED: 'budget:designed',
  BUDGET_ALLOCATED: 'budget:allocated',
} as const;



