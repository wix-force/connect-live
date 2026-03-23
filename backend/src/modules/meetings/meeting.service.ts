import { Meeting, IMeeting } from './meeting.model';
import { generateMeetingId } from '../../utils/helpers';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors';

export const meetingService = {
  async create(hostId: string, data: any) {
    const meetingId = generateMeetingId();
    const meeting = await Meeting.create({
      meetingId,
      hostId,
      title: data.title || 'Untitled Meeting',
      password: data.password || null,
      scheduledAt: data.scheduledAt || null,
      settings: { ...data.settings },
    });
    return meeting;
  },

  async getById(meetingId: string) {
    const meeting = await Meeting.findOne({ meetingId }).populate('hostId', 'name email avatar');
    if (!meeting) throw new NotFoundError('Meeting not found');
    return meeting;
  },

  async getUserMeetings(userId: string, status?: string) {
    const query: any = {
      $or: [{ hostId: userId }, { participants: userId }],
    };
    if (status) query.status = status;
    return Meeting.find(query)
      .sort({ createdAt: -1 })
      .populate('hostId', 'name email avatar')
      .limit(50);
  },

  async joinMeeting(meetingId: string, userId: string, password?: string) {
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) throw new NotFoundError('Meeting not found');
    if (meeting.status === 'ended') throw new BadRequestError('Meeting has ended');

    if (meeting.password && meeting.password !== password) {
      throw new ForbiddenError('Invalid meeting password');
    }

    if (meeting.participants.length >= meeting.settings.maxParticipants) {
      throw new BadRequestError('Meeting is full');
    }

    if (!meeting.participants.includes(userId as any)) {
      meeting.participants.push(userId as any);
    }

    if (meeting.status === 'waiting') {
      meeting.status = 'active';
      meeting.startTime = new Date();
    }

    await meeting.save();
    return meeting;
  },

  async endMeeting(meetingId: string, userId: string) {
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) throw new NotFoundError('Meeting not found');
    if (meeting.hostId.toString() !== userId) throw new ForbiddenError('Only host can end meeting');

    meeting.status = 'ended';
    meeting.endTime = new Date();
    await meeting.save();
    return meeting;
  },

  async updateSettings(meetingId: string, userId: string, updates: any) {
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) throw new NotFoundError('Meeting not found');
    if (meeting.hostId.toString() !== userId) throw new ForbiddenError('Only host can update settings');

    if (updates.title) meeting.title = updates.title;
    if (updates.settings) {
      Object.assign(meeting.settings, updates.settings);
    }
    await meeting.save();
    return meeting;
  },

  async getActiveMeetings() {
    return Meeting.find({ status: 'active' })
      .populate('hostId', 'name email')
      .sort({ startTime: -1 });
  },
};
