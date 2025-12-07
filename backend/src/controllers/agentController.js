const { GoogleGenerativeAI } = require("@google/generative-ai");
const Message = require("../models/Message");
const { successResponse, errorResponse } = require("../utils/response");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const extractFromMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const mongoose = require("mongoose");

    // Try to find by MongoDB _id first, then by Telegram message_id
    let message = null;
    if (mongoose.Types.ObjectId.isValid(messageId)) {
      message = await Message.findById(messageId);
    }

    if (!message) {
      message = await Message.findOne({ message_id: messageId });
    }

    if (!message) {
      return errorResponse(res, 404, "Message not found");
    }

    if (!process.env.GEMINI_API_KEY) {
      return errorResponse(res, 500, "Gemini API key not configured");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `Extract ONLY the following information from this message. Return ONLY JSON with these exact fields: domain, budget, timeline. If information is not found, use null for that field.

Message: "${message.text}"

Return JSON format:
{
  "domain": "...",
  "budget": "...",
  "timeline": "..."
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response (might have markdown code blocks)
    let extracted;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extracted = JSON.parse(jsonMatch[0]);
      } else {
        extracted = JSON.parse(text);
      }
    } catch (parseError) {
      // Fallback: try to extract manually
      extracted = {
        domain: extractField(text, "domain"),
        budget: extractField(text, "budget"),
        timeline: extractField(text, "timeline"),
      };
    }

    // Update message with extracted data
    message.extracted = {
      domain: extracted.domain || null,
      budget: extracted.budget || null,
      timeline: extracted.timeline || null,
    };
    await message.save();

    return successResponse(res, { data: message });
  } catch (error) {
    next(error);
  }
};

// Helper to extract field if JSON parsing fails
const extractField = (text, fieldName) => {
  const regex = new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*)"`, "i");
  const match = text.match(regex);
  return match ? match[1] : null;
};

module.exports = {
  extractFromMessage,
};
