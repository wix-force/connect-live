import { Server, Socket } from 'socket.io';
import { participantService } from '../modules/participants/participant.service';
import { logger } from '../utils/logger';
import { connectedUsers } from './index';

export const handleMediaEvents = (io: Server, socket: Socket) => {
  const userId = (socket as any).userId;
  const userName = (socket as any).userName;

  // Toggle mic
  socket.on('toggle-mic', async (data: { meetingId: string; status: boolean }) => {
    logger.socket('toggle-mic', { userId, status: data.status });
    await participantService.updateStatus(socket.id, { micStatus: data.status });
    socket.to(data.meetingId).emit('meeting-updated', {
      type: 'mic-toggle',
      userId,
      socketId: socket.id,
      name: userName,
      status: data.status,
    });
  });

  // Toggle camera
  socket.on('toggle-camera', async (data: { meetingId: string; status: boolean }) => {
    logger.socket('toggle-camera', { userId, status: data.status });
    await participantService.updateStatus(socket.id, { cameraStatus: data.status });
    socket.to(data.meetingId).emit('meeting-updated', {
      type: 'camera-toggle',
      userId,
      socketId: socket.id,
      name: userName,
      status: data.status,
    });
  });

  // Raise hand
  socket.on('raise-hand', async (data: { meetingId: string; status: boolean }) => {
    logger.socket('raise-hand', { userId, status: data.status });
    await participantService.updateStatus(socket.id, { handRaised: data.status });
    socket.to(data.meetingId).emit('meeting-updated', {
      type: 'hand-raise',
      userId,
      socketId: socket.id,
      name: userName,
      status: data.status,
    });
  });

  // Screen share
  socket.on('start-screen-share', async (data: { meetingId: string }) => {
    logger.socket('start-screen-share', { userId });
    await participantService.updateStatus(socket.id, { isScreenSharing: true });
    socket.to(data.meetingId).emit('meeting-updated', {
      type: 'screen-share-start',
      userId,
      socketId: socket.id,
      name: userName,
    });
  });

  socket.on('stop-screen-share', async (data: { meetingId: string }) => {
    logger.socket('stop-screen-share', { userId });
    await participantService.updateStatus(socket.id, { isScreenSharing: false });
    socket.to(data.meetingId).emit('meeting-updated', {
      type: 'screen-share-stop',
      userId,
      socketId: socket.id,
      name: userName,
    });
  });

  // Host controls: mute participant
  socket.on('host-mute-user', (data: { meetingId: string; targetSocketId: string }) => {
    logger.socket('host-mute-user', { userId, target: data.targetSocketId });
    io.to(data.targetSocketId).emit('force-mute', {
      by: userName,
    });
  });

  // Host controls: remove participant
  socket.on('host-remove-user', (data: { meetingId: string; targetSocketId: string }) => {
    logger.socket('host-remove-user', { userId, target: data.targetSocketId });
    io.to(data.targetSocketId).emit('force-remove', {
      by: userName,
      meetingId: data.meetingId,
    });
  });
};
