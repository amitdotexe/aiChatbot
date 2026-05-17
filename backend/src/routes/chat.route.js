const express = require("express");
const router = express.Router();
const middleware = require("../middleware/auth.middleware");
const chatController = require("../controllers/chat.controller");

router.post("/", middleware.authUser, chatController.createChat);
router.get("/", middleware.authUser, chatController.getAllChats);
router.get(
  "/:chatId/messages",
  middleware.authUser,
  chatController.getChatMessages,
);

module.exports = router;
