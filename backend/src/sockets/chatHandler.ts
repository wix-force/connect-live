import { Server, Socket } from 'socket.io';
import { messageService } from '../modules/messages/message.service';
import { logger } from '../utils/logger';
import { connectedUsers } from './index';

export const handleChatEvents = (io: Server, socket: Socket) => {
  const userId = (socket as any).userId;
  const userName = (socket as any).userName;

  // Chat message
  socket.on('chat-message', async (data: { meetingId: string; message: string; type?: string }) => {
    try {
      const { meetingId, message, type = 'text' } = data;
      logger.socket('chat-message', { meetingId, userId, messageLength: message.length });

      // Validate
      if (!message || message.trim().length === 0) return;
      if (message.length > 2000) return;

      // Save to DB
      const savedMessage = await messageService.create({
        meetingId,
        senderId: userId,
        message: message.trim(),
        type,
      });

      // Broadcast to room
      io.to(meetingId).emit('chat-received', {
        id: savedMessage._id,
        senderId: userId,
        senderName: userName,
        message: savedMessage.message,
        type: savedMessage.type,
        timestamp: savedMessage.timestamp,
      });
    } catch (err) {
      logger.error('chat-message error:', err);
    }
  });

  // Typing indicator
  socket.on('chat-typing', (data: { meetingId: string }) => {
    socket.to(data.meetingId).emit('chat-typing', {
      userId,
      name: userName,
    });
  });

  // Stop typing
  socket.on('chat-stop-typing', (data: { meetingId: string }) => {
    socket.to(data.meetingId).emit('chat-stop-typing', {
      userId,
    });
  });
};
