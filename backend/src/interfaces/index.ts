import { Request } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: 'user' | 'admin';
}

export interface TokenPayload {
  userId: string;
  role: 'user' | 'admin';
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
}

export interface MeetingSettings {
  waitingRoom: boolean;
  muteOnEntry: boolean;
  allowScreenShare: boolean;
  allowChat: boolean;
  allowRecording: boolean;
  maxParticipants: number;
}

export interface SocketUser {
  userId: string;
  socketId: string;
  meetingId: string;
  name: string;
  role: 'host' | 'guest';
  micStatus: boolean;
  cameraStatus: boolean;
  handRaised: boolean;
  isScreenSharing: boolean;
  joinedAt: Date;
}

export interface SignalData {
  to: string;
  from: string;
  signal: any;
  meetingId: string;
}
