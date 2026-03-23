import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { User } from '../auth/auth.model';
import { Meeting } from '../meetings/meeting.model';
import { Participant } from '../participants/participant.model';
import { Message } from '../messages/message.model';
import { AuthenticatedRequest } from '../../interfaces';
import { Response, NextFunction } from 'express';
import os from 'os';

const router = Router();
router.use(authenticate);
router.use(authorize('admin'));

// Server stats
router.get('/stats', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const [totalUsers, totalMeetings, activeMeetings, totalMessages] = await Promise.all([
      User.countDocuments(),
      Meeting.countDocuments(),
      Meeting.countDocuments({ status: 'active' }),
      Message.countDocuments(),
    ]);
    res.json({
      success: true,
      message: 'Stats retrieved',
      data: { totalUsers, totalMeetings, activeMeetings, totalMessages, uptime: process.uptime() },
    });
  } catch (err) { next(err); }
});

// Active meetings
router.get('/meetings/active', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const meetings = await Meeting.find({ status: 'active' })
      .populate('hostId', 'name email')
      .sort({ startTime: -1 });
    res.json({ success: true, message: 'Active meetings', data: meetings });
  } catch (err) { next(err); }
});

// All users
router.get('/users', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(),
    ]);
    res.json({ success: true, message: 'Users retrieved', data: { users, total, page, limit } });
  } catch (err) { next(err); }
});

// Ban user
router.post('/users/:userId/ban', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User banned and removed' });
  } catch (err) { next(err); }
});

// Update user role
router.patch('/users/:userId/role', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.userId, { role }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Role updated', data: user });
  } catch (err) { next(err); }
});

// Force end meeting
router.delete('/meetings/:meetingId/end', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const meeting = await Meeting.findOneAndUpdate(
      { meetingId: req.params.meetingId },
      { status: 'ended', endTime: new Date() },
      { new: true }
    );
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    res.json({ success: true, message: 'Meeting force ended' });
  } catch (err) { next(err); }
});

// Analytics
router.get('/analytics', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [meetingsLast30d, usersLast30d, avgParticipants] = await Promise.all([
      Meeting.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Meeting.aggregate([
        { $match: { status: 'ended' } },
        { $project: { participantCount: { $size: '$participants' } } },
        { $group: { _id: null, avg: { $avg: '$participantCount' } } },
      ]),
    ]);
    res.json({
      success: true,
      message: 'Analytics retrieved',
      data: {
        meetingsLast30Days: meetingsLast30d,
        newUsersLast30Days: usersLast30d,
        avgParticipantsPerMeeting: avgParticipants[0]?.avg || 0,
      },
    });
  } catch (err) { next(err); }
});

// Server status
router.get('/server-status', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;

    // Simple CPU usage approximation
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

    res.json({
      success: true,
      message: 'Server status',
      data: {
        cpuUsage: Math.round(cpuUsage * 10) / 10,
        memoryUsage: Math.round(memoryUsage * 10) / 10,
        activeSockets: 0, // Would be injected from socket.io instance
        uptime: process.uptime(),
      },
    });
  } catch (err) { next(err); }
});

export { router as adminRoutes };
