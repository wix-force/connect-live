import http from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../config';
import { logger } from '../utils/logger';
import { handleMeetingEvents } from './meetingHandler';
import { handleChatEvents } from './chatHandler';
import { handleSignalingEvents } from './signalingHandler';
import { handleMediaEvents } from './mediaHandler';
import { participantService } from '../modules/participants/participant.service';

// In-memory store for connected users
export const connectedUsers = new Map<string, {
  userId: string;
  socketId: string;
  meetingId: string | null;
  name: string;
}>();

export const meetingRooms = new Map<string, Set<string>>(); // meetingId -> Set<socketId>

let io: Server;

export const getIO = (): Server => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

export const initSocketServer = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: config.client.url,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });


  // Authentication middleware
  io.use((socket, next) => {
    const { userId, name } = socket.handshake.auth;
    if (!userId || !name) {
      return next(new Error('Authentication required'));
    }
    (socket as any).userId = userId;
    (socket as any).userName = name;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    const userName = (socket as any).userName;

    logger.socket('connection', { socketId: socket.id, userId, name: userName });

    // Register connected user
    connectedUsers.set(socket.id, {
      userId,
      socketId: socket.id,
      meetingId: null,
      name: userName,
    });

    // Register event handlers
    handleMeetingEvents(io, socket);
    handleSignalingEvents(io, socket);
    handleChatEvents(io, socket);
    handleMediaEvents(io, socket);

    // Disconnect
    socket.on('disconnect', async (reason) => {
      logger.socket('disconnect', { socketId: socket.id, userId, reason });

      const user = connectedUsers.get(socket.id);
      if (user?.meetingId) {
        // Remove from room
        const room = meetingRooms.get(user.meetingId);
        if (room) {
          room.delete(socket.id);
          if (room.size === 0) meetingRooms.delete(user.meetingId);
        }

        // Update participant record
        await participantService.removeParticipant(user.meetingId, socket.id);

        // Notify room
        socket.to(user.meetingId).emit('participant-left', {
          userId,
          socketId: socket.id,
          name: userName,
          timestamp: new Date(),
        });
      }

      connectedUsers.delete(socket.id);
    });

    // Error handling
    socket.on('error', (err) => {
      logger.error('Socket error:', err.message);
    });
  });

  logger.info('Socket.IO server initialized');
  return io;
};
