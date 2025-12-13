import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IMeeting extends Document {
  messageId: Types.ObjectId;
  project_name: string;
  client_details: {
    name: string;
    email?: string;
    company?: string;
  };
  meeting_date: Date;
  participants: string[];
  estimated_budget: number;
  timeline: string;
  requirements: string;
  extracted_at: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema = new Schema<IMeeting>(
  {
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      required: true,
      unique: true,
    },
    project_name: { type: String, required: true },
    client_details: {
      name: { type: String, required: true },
      email: { type: String },
      company: { type: String },
    },
    meeting_date: { type: Date, required: true },
    participants: [{ type: String }],
    estimated_budget: { type: Number, required: true },
    timeline: { type: String, required: true },
    requirements: { type: String, required: true },
    extracted_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for faster queries (messageId already has unique index from unique: true)
MeetingSchema.index({ project_name: 1 });
MeetingSchema.index({ 'client_details.name': 1 });

const Meeting: Model<IMeeting> = mongoose.model<IMeeting>('Meeting', MeetingSchema);

export default Meeting;

