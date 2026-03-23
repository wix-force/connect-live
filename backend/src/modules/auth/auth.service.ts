import jwt from 'jsonwebtoken';
import { User, IUser } from './auth.model';
import { config } from '../../config';
import { BadRequestError, ConflictError, UnauthorizedError, NotFoundError } from '../../utils/errors';
import { sanitizeUser } from '../../utils/helpers';
import { TokenPayload } from '../../interfaces';

const generateAccessToken = (user: IUser): string => {
  return jwt.sign(
    { userId: user._id, role: user.role } as TokenPayload,
    config.jwt.secret,
    { expiresIn: config.jwt.expires }
  );
};

const generateRefreshToken = (user: IUser): string => {
  return jwt.sign(
    { userId: user._id, role: user.role } as TokenPayload,
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpires }
  );
};

export const authService = {
  async register(data: { name: string; email: string; password: string }) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const user = await User.create(data);
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  },

  async login(data: { email: string; password: string }) {
    const user = await User.findOne({ email: data.email }).select('+password');
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  },

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
      const user = await User.findById(decoded.userId).select('+refreshToken');

      if (!user || user.refreshToken !== token) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const accessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      user.refreshToken = newRefreshToken;
      await user.save();

      return { accessToken, refreshToken: newRefreshToken };
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  },

  async logout(userId: string) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  },

  async getProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return sanitizeUser(user);
  },
};
