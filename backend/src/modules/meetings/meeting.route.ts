import { Router } from 'express';
import { meetingController } from './meeting.controller';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createMeetingSchema, joinMeetingSchema, updateMeetingSchema } from './meeting.validation';

const router = Router();

router.use(authenticate);

router.post('/', validate(createMeetingSchema), meetingController.create);
router.get('/', meetingController.getUserMeetings);
router.get('/:meetingId', meetingController.getById);
router.post('/:meetingId/join', validate(joinMeetingSchema), meetingController.join);
router.post('/:meetingId/end', meetingController.end);
router.patch('/:meetingId', validate(updateMeetingSchema), meetingController.updateSettings);

export { router as meetingRoutes };
