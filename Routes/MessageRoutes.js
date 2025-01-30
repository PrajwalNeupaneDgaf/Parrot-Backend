const express = require("express");
const Auth = require("../middleWare/Auth");
const {
  getChatData,
  sendMessage,
  editMessage,
  deleteMessage,
  deleteAllChat,
  getMessages,
} = require("../Controllers/MessageController");

const router = express.Router();


router.get("/getchats", Auth, getChatData);

// Send a message
router.post("/send", Auth, sendMessage);

// Edit a message
router.put("/edit", Auth, editMessage);

// Delete a specific message
router.delete("/:messageId", Auth, deleteMessage);

// Delete all chat between two users
router.delete("/all/:receiverId", Auth, deleteAllChat);

// Get all messages between the logged-in user and a receiver
router.get("/specific/:receiverId", Auth, getMessages);

module.exports = router;
