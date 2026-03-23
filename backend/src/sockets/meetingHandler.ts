import { Server, Socket } from 'socket.io';
import { connectedUsers, meetingRooms } from './index';
import { participantService } from '../modules/participants/participant.service';
import { meetingService } from '../modules/meetings/meeting.service';
import { logger } from '../utils/logger';

export const handleMeetingEvents = (io: Server, socket: Socket) => {
  const userId = (socket as any).userId;
  const userName = (socket as any).userName;

  // Join meeting
  socket.on('join-meeting', async (data: { meetingId: string; role?: 'host' | 'guest' }) => {
    try {
      const { meetingId, role = 'guest' } = data;
      logger.socket('join-meeting', { socketId: socket.id, meetingId, userId });

      // Join socket room
      socket.join(meetingId);

      // Update connected user
      const user = connectedUsers.get(socket.id);
      if (user) user.meetingId = meetingId;

      // Track room members
      if (!meetingRooms.has(meetingId)) {
        meetingRooms.set(meetingId, new Set());
      }
      meetingRooms.get(meetingId)!.add(socket.id);

      // Create participant record
      await participantService.addParticipant({
        userId,
        meetingId,
        socketId: socket.id,
        role,
      });

      // Get current participants
      const participants = await participantService.getActiveParticipants(meetingId);

      // Notify existing participants
      socket.to(meetingId).emit('participant-joined', {
        userId,
        socketId: socket.id,
        name: userName,
        role,
        timestamp: new Date(),
      });

      // Send current state to joining user
      socket.emit('meeting-joined', {
        meetingId,
        participants: participants.map(p => ({
          userId: p.userId,
          socketId: p.socketId,
          role: p.role,
          micStatus: p.micStatus,
          cameraStatus: p.cameraStatus,
          handRaised: p.handRaised,
          isScreenSharing: p.isScreenSharing,
        })),
      });

      logger.info(`User ${userName} joined meeting ${meetingId} (${meetingRooms.get(meetingId)?.size} participants)`);
    } catch (err) {
      logger.error('join-meeting error:', err);
      socket.emit('error', { message: 'Failed to join meeting' });
    }
  });

  // Leave meeting
  socket.on('leave-meeting', async (data: { meetingId: string }) => {
    try {
      const { meetingId } = data;
      logger.socket('leave-meeting', { socketId: socket.id, meetingId });

      socket.leave(meetingId);

      const user = connectedUsers.get(socket.id);
      if (user) user.meetingId = null;

      const room = meetingRooms.get(meetingId);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) meetingRooms.delete(meetingId);
      }

      await participantService.removeParticipant(meetingId, socket.id);

      socket.to(meetingId).emit('participant-left', {
        userId,
        socketId: socket.id,
        name: userName,
        timestamp: new Date(),
      });
    } catch (err) {
      logger.error('leave-meeting error:', err);
    }
  });

  // End meeting (host only)
  socket.on('end-meeting', async (data: { meetingId: string }) => {
    try {
      const { meetingId } = data;
      logger.socket('end-meeting', { socketId: socket.id, meetingId });

      await meetingService.endMeeting(meetingId, userId);
      await participantService.removeAllFromMeeting(meetingId);

      io.to(meetingId).emit('meeting-ended', {
        meetingId,
        endedBy: userName,
        timestamp: new Date(),
      });

      // Disconnect all sockets from room
      const room = meetingRooms.get(meetingId);
      if (room) {
        room.forEach(sid => {
          const s = io.sockets.sockets.get(sid);
          if (s) s.leave(meetingId);
          const u = connectedUsers.get(sid);
          if (u) u.meetingId = null;
        });
        meetingRooms.delete(meetingId);
      }
    } catch (err) {
      logger.error('end-meeting error:', err);
      socket.emit('error', { message: 'Failed to end meeting' });
    }
  });
};
