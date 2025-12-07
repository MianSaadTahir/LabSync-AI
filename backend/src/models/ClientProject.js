const mongoose = require('mongoose');

const ClientProjectSchema = new mongoose.Schema(
  {
    messageId: { type: String, required: true },
    raw_text: { type: String, required: true },
    domain: { type: String },
    budget: { type: String },
    timeline: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClientProject', ClientProjectSchema);

