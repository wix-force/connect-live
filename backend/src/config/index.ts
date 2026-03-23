import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/meetflow',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expires: process.env.JWT_EXPIRES || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  client: {
    url: process.env.CLIENT_URL || 'http://localhost:5173',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
};
