import mongoose, { Schema, Document } from 'mongoose';

export interface IParticipant extends Document {
  userId: mongoose.Types.ObjectId;
  meetingId: string;
  socketId: string;
  role: 'host' | 'guest';
  micStatus: boolean;
  cameraStatus: boolean;
  handRaised: boolean;
  isScreenSharing: boolean;
  joinedAt: Date;
  leftAt?: Date;
}

const participantSchema = new Schema<IParticipant>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    meetingId: { type: String, required: true, index: true },
    socketId: { type: String, required: true },
    role: { type: String, enum: ['host', 'guest'], default: 'guest' },
    micStatus: { type: Boolean, default: true },
    cameraStatus: { type: Boolean, default: true },
    handRaised: { type: Boolean, default: false },
    isScreenSharing: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
    leftAt: Date,
  },
  { timestamps: true }
);

participantSchema.index({ meetingId: 1, userId: 1 });

export const Participant = mongoose.model<IParticipant>('Participant', participantSchema);
