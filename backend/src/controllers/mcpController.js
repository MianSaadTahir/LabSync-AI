const ClientProject = require('../models/ClientProject');
const Message = require('../models/Message');
const { successResponse, errorResponse } = require('../utils/response');

const routeToProject = async (req, res, next) => {
  try {
    const { messageId, extracted } = req.body;

    if (!messageId || !extracted) {
      return errorResponse(res, 400, 'messageId and extracted are required');
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return errorResponse(res, 404, 'Message not found');
    }

    const project = await ClientProject.create({
      messageId: messageId,
      raw_text: message.text,
      domain: extracted.domain || null,
      budget: extracted.budget || null,
      timeline: extracted.timeline || null,
    });

    return successResponse(res, { data: project }, 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  routeToProject,
};

