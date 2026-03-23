import mongoose, { Schema, Document } from 'mongoose';

export interface IRecording extends Document {
  meetingId: string;
  userId: mongoose.Types.ObjectId;
  status: 'recording' | 'processing' | 'completed' | 'failed';
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  fileSize?: number;
  storagePath?: string;
  mimeType: string;
  metadata: {
    resolution?: string;
    format?: string;
    participantCount?: number;
  };
}

const recordingSchema = new Schema<IRecording>(
  {
    meetingId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['recording', 'processing', 'completed', 'failed'],
      default: 'recording',
    },
    startedAt: { type: Date, default: Date.now },
    endedAt: Date,
    duration: Number,
    fileSize: Number,
    storagePath: String,
    mimeType: { type: String, default: 'video/webm' },
    metadata: {
      resolution: String,
      format: String,
      participantCount: Number,
    },
  },
  { timestamps: true }
);

export const Recording = mongoose.model<IRecording>('Recording', recordingSchema);
