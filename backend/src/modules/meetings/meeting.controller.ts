import { Response, NextFunction } from 'express';
import { meetingService } from './meeting.service';
import { AuthenticatedRequest } from '../../interfaces';

export const meetingController = {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const meeting = await meetingService.create(req.userId!, req.body);
      res.status(201).json({ success: true, message: 'Meeting created', data: meeting });
    } catch (err) { next(err); }
  },

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const meeting = await meetingService.getById(req.params.meetingId);
      res.json({ success: true, message: 'Meeting retrieved', data: meeting });
    } catch (err) { next(err); }
  },

  async getUserMeetings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string | undefined;
      const meetings = await meetingService.getUserMeetings(req.userId!, status);
      res.json({ success: true, message: 'Meetings retrieved', data: meetings });
    } catch (err) { next(err); }
  },

  async join(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const meeting = await meetingService.joinMeeting(req.params.meetingId, req.userId!, req.body.password);
      res.json({ success: true, message: 'Joined meeting', data: meeting });
    } catch (err) { next(err); }
  },

  async end(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const meeting = await meetingService.endMeeting(req.params.meetingId, req.userId!);
      res.json({ success: true, message: 'Meeting ended', data: meeting });
    } catch (err) { next(err); }
  },

  async updateSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const meeting = await meetingService.updateSettings(req.params.meetingId, req.userId!, req.body);
      res.json({ success: true, message: 'Settings updated', data: meeting });
    } catch (err) { next(err); }
  },
};
