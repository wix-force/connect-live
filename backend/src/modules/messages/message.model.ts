import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  meetingId: string;
  senderId: mongoose.Types.ObjectId;
  message: string;
  type: 'text' | 'file' | 'system';
  timestamp: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    meetingId: { type: String, required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, maxlength: 2000 },
    type: { type: String, enum: ['text', 'file', 'system'], default: 'text' },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

messageSchema.index({ meetingId: 1, timestamp: 1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
