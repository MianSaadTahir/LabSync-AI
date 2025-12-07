const { validationResult } = require('express-validator');
const Message = require('../models/Message');
const { successResponse, errorResponse } = require('../utils/response');

const getMessages = async (req, res, next) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    return successResponse(res, { data: messages });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
};
