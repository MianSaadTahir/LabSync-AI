import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClientProject extends Document {
  messageId: string;
  raw_text: string;
  domain?: string | null;
  budget?: string | null;
  timeline?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ClientProjectSchema = new Schema<IClientProject>(
  {
    messageId: { type: String, required: true },
    raw_text: { type: String, required: true },
    domain: { type: String },
    budget: { type: String },
    timeline: { type: String },
  },
  { timestamps: true }
);

const ClientProject: Model<IClientProject> = mongoose.model<IClientProject>(
  'ClientProject',
  ClientProjectSchema
);

export default ClientProject;





