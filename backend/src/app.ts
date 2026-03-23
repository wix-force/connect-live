import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { globalErrorHandler } from './middlewares/errorHandler';
import { apiRateLimiter } from './middlewares/rateLimiter';
import { authRoutes } from './modules/auth/auth.route';
import { userRoutes } from './modules/users/user.route';
import { meetingRoutes } from './modules/meetings/meeting.route';
import { messageRoutes } from './modules/messages/message.route';
import { adminRoutes } from './modules/admin/admin.route';
import { recordingRoutes } from './modules/recordings/recording.route';

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: config.client.url,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api/', apiRateLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'MeetFlow API is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/recordings', recordingRoutes);
app.use('/api/admin', adminRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(globalErrorHandler);

export default app;
