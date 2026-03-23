import { z } from 'zod';

export const createMeetingSchema = z.object({
  title: z.string().trim().min(1).max(200).optional().default('Untitled Meeting'),
  password: z.string().max(50).optional(),
  scheduledAt: z.string().datetime().optional(),
  settings: z.object({
    waitingRoom: z.boolean().optional(),
    muteOnEntry: z.boolean().optional(),
    allowScreenShare: z.boolean().optional(),
    allowChat: z.boolean().optional(),
    allowRecording: z.boolean().optional(),
    maxParticipants: z.number().min(2).max(500).optional(),
  }).optional(),
});

export const joinMeetingSchema = z.object({
  password: z.string().optional(),
});

export const updateMeetingSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  settings: z.object({
    waitingRoom: z.boolean().optional(),
    muteOnEntry: z.boolean().optional(),
    allowScreenShare: z.boolean().optional(),
    allowChat: z.boolean().optional(),
    allowRecording: z.boolean().optional(),
    maxParticipants: z.number().min(2).max(500).optional(),
  }).optional(),
});
