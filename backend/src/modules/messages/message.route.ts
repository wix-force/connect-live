import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { messageService } from './message.service';
import { AuthenticatedRequest } from '../../interfaces';
import { Response, NextFunction } from 'express';
import { validate } from '../../middlewares/validate';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

const sendMessageSchema = z.object({
  meetingId: z.string().min(1),
  message: z.string().trim().min(1).max(2000),
  type: z.enum(['text', 'file', 'system']).optional(),
});

router.post('/', validate(sendMessageSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const msg = await messageService.create({ ...req.body, senderId: req.userId });
    res.status(201).json({ success: true, message: 'Message sent', data: msg });
  } catch (err) { next(err); }
});

router.get('/:meetingId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await messageService.getByMeeting(req.params.meetingId, page, limit);
    res.json({ success: true, message: 'Messages retrieved', data: result });
  } catch (err) { next(err); }
});

export { router as messageRoutes };
