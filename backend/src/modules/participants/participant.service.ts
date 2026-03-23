import { Participant } from './participant.model';

export const participantService = {
  async addParticipant(data: {
    userId: string;
    meetingId: string;
    socketId: string;
    role: 'host' | 'guest';
  }) {
    // Remove existing entry if reconnecting
    await Participant.deleteOne({ meetingId: data.meetingId, userId: data.userId });
    return Participant.create(data);
  },

  async removeParticipant(meetingId: string, socketId: string) {
    return Participant.findOneAndUpdate(
      { meetingId, socketId },
      { leftAt: new Date() },
      { new: true }
    );
  },

  async getActiveParticipants(meetingId: string) {
    return Participant.find({ meetingId, leftAt: null })
      .populate('userId', 'name email avatar');
  },

  async updateStatus(socketId: string, updates: Partial<{
    micStatus: boolean;
    cameraStatus: boolean;
    handRaised: boolean;
    isScreenSharing: boolean;
  }>) {
    return Participant.findOneAndUpdate(
      { socketId, leftAt: null },
      updates,
      { new: true }
    );
  },

  async getBySocketId(socketId: string) {
    return Participant.findOne({ socketId, leftAt: null });
  },

  async removeAllFromMeeting(meetingId: string) {
    return Participant.updateMany(
      { meetingId, leftAt: null },
      { leftAt: new Date() }
    );
  },
};
