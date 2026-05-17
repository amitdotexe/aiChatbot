const chatModel = require("../models/chat.model");
const messageModel = require("../models/message.model");

async function createChat(req, res) {
  try {
    const { title } = req.body;
    const user = req.user;

    const chat = await chatModel.create({
      user: user._id,
      title,
      lastActivity: Date.now(),
    });

    res.status(201).json({
      message: "Chat created successfully",
      chat: {
        _id: chat._id,
        title: chat.title,
        lastActivity: chat.lastActivity,
      },
    });
  } catch (error) {
    console.error("Error in createChat controller:", error);
    res.status(500).json({ message: error.message });
  }
}

async function getAllChats(req, res) {
  try {
    const chats = await chatModel
      .find({ user: req.user._id })
      .sort({ lastActivity: -1 })
      .select("_id title lastActivity createdAt");

    res.status(200).json({ chats });
  } catch (error) {
    console.error("Error in getAllChats controller:", error);
    res.status(500).json({ message: error.message });
  }
}

async function getChatMessages(req, res) {
  try {
    const { chatId } = req.params;

    const chat = await chatModel.findOne({
      _id: chatId,
      user: req.user._id,
    });

    if (!chat) {
      return res
        .status(404)
        .json({ message: "Chat not found or access denied" });
    }

    const messages = await messageModel
      .find({ chat: chatId })
      .sort({ createdAt: 1 })
      .select("_id role content createdAt");

    res.status(200).json({
      chat: {
        _id: chat._id,
        title: chat.title,
        lastActivity: chat.lastActivity,
      },
      messages,
    });
  } catch (error) {
    console.error("Error in getChatMessages controller:", error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = { createChat, getAllChats, getChatMessages };
