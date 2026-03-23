import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { AuthenticatedRequest } from '../../interfaces';
import { Response, NextFunction } from 'express';
import { Meeting } from '../meetings/meeting.model';
import { Recording } from '../recordings/recording.model';

const router = Router();
router.use(authenticate);

// User dashboard overview
router.get('/overview', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const [allMeetings, recordings] = await Promise.all([
      Meeting.find({ $or: [{ hostId: userId }, { participants: userId }] }),
      Recording.countDocuments({ userId }),
    ]);

    const now = new Date();
    const upcoming = allMeetings.filter(m => m.status !== 'ended');
    let totalHours = 0;
    allMeetings.forEach(m => {
      if (m.startTime && m.endTime) {
        totalHours += (new Date(m.endTime).getTime() - new Date(m.startTime).getTime()) / 3600000;
      }
    });

    res.json({
      success: true,
      message: 'Dashboard overview',
      data: {
        meetingCount: allMeetings.length,
        upcomingMeetings: upcoming.length,
        totalHours: Math.round(totalHours * 10) / 10,
        recordingsCount: recordings,
      },
    });
  } catch (err) { next(err); }
});

// Weekly activity
router.get('/activity', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

    const meetings = await Meeting.find({
      $or: [{ hostId: userId }, { participants: userId }],
      createdAt: { $gte: sevenDaysAgo },
    });

    const activity = days.map((day, i) => {
      const count = meetings.filter(m => new Date(m.createdAt).getDay() === i).length;
      return { day, meetings: count };
    });

    res.json({ success: true, message: 'Activity data', data: activity });
  } catch (err) { next(err); }
});

export { router as dashboardRoutes };
