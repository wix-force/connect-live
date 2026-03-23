import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';

export const handleSignalingEvents = (io: Server, socket: Socket) => {
  const userId = (socket as any).userId;

  // WebRTC Offer
  socket.on('send-offer', (data: { to: string; offer: any; meetingId: string }) => {
    logger.socket('send-offer', { from: socket.id, to: data.to });
    io.to(data.to).emit('receive-offer', {
      from: socket.id,
      fromUserId: userId,
      offer: data.offer,
      meetingId: data.meetingId,
    });
  });

  // WebRTC Answer
  socket.on('send-answer', (data: { to: string; answer: any; meetingId: string }) => {
    logger.socket('send-answer', { from: socket.id, to: data.to });
    io.to(data.to).emit('receive-answer', {
      from: socket.id,
      fromUserId: userId,
      answer: data.answer,
      meetingId: data.meetingId,
    });
  });

  // ICE Candidate
  socket.on('ice-candidate', (data: { to: string; candidate: any; meetingId: string }) => {
    logger.socket('ice-candidate', { from: socket.id, to: data.to });
    io.to(data.to).emit('receive-ice', {
      from: socket.id,
      fromUserId: userId,
      candidate: data.candidate,
      meetingId: data.meetingId,
    });
  });
};
