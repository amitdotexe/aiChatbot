const { Server } = require("socket.io");
const userModel = require("../models/user.model");
const chatModel = require("../models/chat.model");
const jwt = require("jsonwebtoken");
const { generateResponse } = require("../services/ai.service");
const messageModel = require("../models/message.model");

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userModel.findById(decoded.id);
      if (!user) {
        return next(new Error("User not found"));
      }
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("ai-message", async (messagePayload) => {
      try {
        let content = "";
        let chatId = null;

        if (typeof messagePayload === "string") {
          try {
            const parsed = JSON.parse(messagePayload);
            content = parsed.content || parsed.message || "";
            chatId = parsed.chat || parsed.chatId || null;
          } catch (e) {
            console.error("Failed to parse message payload as JSON", e);
          }
        } else {
          content = messagePayload.content || messagePayload.message || "";
          chatId = messagePayload.chat || messagePayload.chatId || null;
        }

        if (!chatId || !content) {
          return socket.emit(
            "ai-error",
            "Invalid payload: chat and content are required",
          );
        }

        const chat = await chatModel.findOne({
          _id: chatId,
          user: socket.user._id,
        });

        if (!chat) {
          return socket.emit("ai-error", "Chat not found or access denied");
        }

        await messageModel.create({
          user: socket.user._id,
          chat: chatId,
          content,
          role: "user",
        });

        const chatHistory = await messageModel
          .find({ chat: chatId })
          .sort({ createdAt: 1 });

        let aiResponse;

        try {
          aiResponse = await generateResponse(
            chatHistory.map((item) => ({
              role: item.role,
              parts: [{ text: item.content }],
            })),
            (chunk) => {
              socket.emit("ai-response", chunk);
            },
          );
        } catch (err) {
          return socket.emit("ai-error", "AI service unavailable");
        }

        socket.emit("ai-response-end");

        await messageModel.create({
          user: socket.user._id,
          chat: chatId,
          content: aiResponse,
          role: "model",
        });

        await chatModel.findByIdAndUpdate(chatId, {
          lastActivity: Date.now(),
        });
      } catch (err) {
        console.error("Socket ai-message error:", err);
        socket.emit("ai-error", "Internal server error");
      }
    });
  });
}

module.exports = { initSocketServer };
