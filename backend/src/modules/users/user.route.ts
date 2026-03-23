import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { User } from '../auth/auth.model';
import { AuthenticatedRequest } from '../../interfaces';
import { Response, NextFunction } from 'express';
import { sanitizeUser } from '../../utils/helpers';

const router = Router();

router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User retrieved', data: sanitizeUser(user) });
  } catch (err) { next(err); }
});

router.patch('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { ...(name && { name }), ...(avatar && { avatar }) },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Profile updated', data: sanitizeUser(user) });
  } catch (err) { next(err); }
});

export { router as userRoutes };
