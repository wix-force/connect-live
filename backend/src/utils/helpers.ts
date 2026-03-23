import { v4 as uuidv4 } from 'uuid';

export const generateMeetingId = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const segments = [];
  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 3 + (i === 1 ? 1 : 0); j++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }
  return segments.join('-'); // e.g., "abc-defg-hij"
};

export const generateId = (): string => uuidv4();

export const sanitizeUser = (user: any) => {
  const { password, __v, ...sanitized } = user.toObject ? user.toObject() : user;
  return sanitized;
};

export const paginateQuery = (page = 1, limit = 20) => {
  const skip = (Math.max(1, page) - 1) * Math.min(limit, 100);
  return { skip, limit: Math.min(limit, 100) };
};
