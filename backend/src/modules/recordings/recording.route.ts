import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { Recording } from './recording.model';
import { AuthenticatedRequest } from '../../interfaces';
import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate';

const router = Router();
router.use(authenticate);

const startRecordingSchema = z.object({
  meetingId: z.string().min(1),
});

router.post('/start', validate(startRecordingSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const recording = await Recording.create({
      meetingId: req.body.meetingId,
      userId: req.userId,
    });
    res.status(201).json({ success: true, message: 'Recording started', data: recording });
  } catch (err) { next(err); }
});

router.post('/:id/stop', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const recording = await Recording.findByIdAndUpdate(
      req.params.id,
      {
        status: 'processing',
        endedAt: new Date(),
      },
      { new: true }
    );
    if (!recording) return res.status(404).json({ success: false, message: 'Recording not found' });
    res.json({ success: true, message: 'Recording stopped', data: recording });
  } catch (err) { next(err); }
});

router.get('/meeting/:meetingId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const recordings = await Recording.find({ meetingId: req.params.meetingId }).sort({ startedAt: -1 });
    res.json({ success: true, message: 'Recordings retrieved', data: recordings });
  } catch (err) { next(err); }
});

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const recordings = await Recording.find({ userId: req.userId }).sort({ startedAt: -1 }).limit(50);
    res.json({ success: true, message: 'Recordings retrieved', data: recordings });
  } catch (err) { next(err); }
});

export { router as recordingRoutes };
