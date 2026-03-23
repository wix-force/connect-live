import { Message } from './message.model';
import { paginateQuery } from '../../utils/helpers';

export const messageService = {
  async create(data: { meetingId: string; senderId: string; message: string; type?: string }) {
    return Message.create(data);
  },

  async getByMeeting(meetingId: string, page = 1, limit = 50) {
    const { skip } = paginateQuery(page, limit);
    const [messages, total] = await Promise.all([
      Message.find({ meetingId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('senderId', 'name avatar'),
      Message.countDocuments({ meetingId }),
    ]);
    return { messages: messages.reverse(), total, page, limit };
  },
};
