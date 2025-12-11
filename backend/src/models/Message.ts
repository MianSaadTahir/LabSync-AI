import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
  message_id: string;
  sender_id: string;
  text: string;
  date_received: Date;
  raw_payload: any;
  tag: 'meeting' | 'reminder' | 'task' | 'none';
  extracted?: {
    domain?: string | null;
    budget?: string | null;
    timeline?: string | null;
  };
  meeting_details?: {
    project_name?: string;
    client_details?: {
      name?: string;
      email?: string;
      company?: string;
    };
    meeting_date?: Date;
    participants?: string[];
    estimated_budget?: number;
    timeline?: string;
    requirements?: string;
  };
  module1_status: 'pending' | 'extracted' | 'failed';
  module2_status: 'pending' | 'designed' | 'failed';
  module3_status: 'pending' | 'allocated' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    message_id: { type: String, required: true, unique: true },
    sender_id: { type: String, required: true },
    text: { type: String, required: true },
    date_received: { type: Date, default: Date.now },
    raw_payload: { type: Schema.Types.Mixed, required: true },
    tag: {
      type: String,
      enum: ['meeting', 'reminder', 'task', 'none'],
      default: 'none',
    },
    extracted: {
      domain: { type: String },
      budget: { type: String },
      timeline: { type: String },
    },
    meeting_details: {
      project_name: { type: String },
      client_details: {
        name: { type: String },
        email: { type: String },
        company: { type: String },
      },
      meeting_date: { type: Date },
      participants: [{ type: String }],
      estimated_budget: { type: Number },
      timeline: { type: String },
      requirements: { type: String },
    },
    module1_status: {
      type: String,
      enum: ['pending', 'extracted', 'failed'],
      default: 'pending',
    },
    module2_status: {
      type: String,
      enum: ['pending', 'designed', 'failed'],
      default: 'pending',
    },
    module3_status: {
      type: String,
      enum: ['pending', 'allocated', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const Message: Model<IMessage> = mongoose.model<IMessage>('Message', MessageSchema);

export default Message;





