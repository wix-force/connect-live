import mongoose, { Schema, Document } from 'mongoose';
import { MeetingSettings } from '../../interfaces';

export interface IMeeting extends Document {
  meetingId: string;
  hostId: mongoose.Types.ObjectId;
  title: string;
  password?: string;
  startTime?: Date;
  endTime?: Date;
  scheduledAt?: Date;
  status: 'waiting' | 'active' | 'ended';
  participants: mongoose.Types.ObjectId[];
  settings: MeetingSettings;
  createdAt: Date;
  updatedAt: Date;
}

const meetingSchema = new Schema<IMeeting>(
  {
    meetingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Untitled Meeting',
      maxlength: 200,
    },
    password: {
      type: String,
      default: null,
    },
    startTime: Date,
    endTime: Date,
    scheduledAt: Date,
    status: {
      type: String,
      enum: ['waiting', 'active', 'ended'],
      default: 'waiting',
    },
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    settings: {
      waitingRoom: { type: Boolean, default: false },
      muteOnEntry: { type: Boolean, default: true },
      allowScreenShare: { type: Boolean, default: true },
      allowChat: { type: Boolean, default: true },
      allowRecording: { type: Boolean, default: true },
      maxParticipants: { type: Number, default: 100, min: 2, max: 500 },
    },
  },
  {
    timestamps: true,
  }
);

meetingSchema.index({ hostId: 1, status: 1 });
meetingSchema.index({ status: 1, createdAt: -1 });

export const Meeting = mongoose.model<IMeeting>('Meeting', meetingSchema);
