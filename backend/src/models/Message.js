const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    message_id: { type: String, required: true, unique: true },
    sender_id: { type: String, required: true },
    text: { type: String, required: true },
    date_received: { type: Date, default: Date.now },
    raw_payload: { type: mongoose.Schema.Types.Mixed, required: true },
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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', MessageSchema);
