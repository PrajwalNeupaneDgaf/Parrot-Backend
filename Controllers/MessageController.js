const mongoose = require("mongoose");
const User = require("../Models/Users");
const Message = require("../Models/Messages");
const { getReceiverId, io } = require("../Utils/Socket");

// Function to send a message
const sendMessage = async (req, res) => {
  const { receiverId, message, isShared } = req.body;
  const senderId = req.user.id;

  try {
    if (!receiverId || !message) throw new Error("Receiver and message are required");

    // Create new message
    const newMessage = await Message.create({
      Sender: senderId,
      Receiver: receiverId,
      Message: message,
      isShared: isShared,
    });
    const sender = await User.findById(senderId).select('chats name _id profile')
    const receiver = await User.findById(receiverId).select('chats name _id profile')

    const lastText = isShared ? "Send a Link" : message.length > 15 ? message.slice(0, 15) + "..." : message;

    sender.chats = sender.chats.filter(itm => itm.chatsWith.toString() !== receiverId);
    receiver.chats = receiver.chats.filter(itm => itm.chatsWith.toString() !== senderId);

    sender.chats.push({ chatsWith: receiverId, lastText });
    receiver.chats.push({ chatsWith: senderId, lastText });

    await sender.save();
    await receiver.save();
    // Emit real-time message to receiver if online
    const receiverSocketId = getReceiverId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("Message", {
        newMessage,
        sender,
        receiver
      });
    }

    res.status(201).json({ message: "Message sent successfully", data: newMessage ,receiver:receiver});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Function to edit a message
const editMessage = async (req, res) => {
  const { messageId, newMessage } = req.body;
  const userId = req.user.id;

  try {
    const message = await Message.findOneAndUpdate(
      { _id: messageId, Sender: userId },
      { Message: newMessage },
      { new: true }
    );

    if (!message) throw new Error("Message not found or unauthorized");

    const receiverSocketId = getReceiverId(message.Receiver);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("editMessage", {
       messageId:messageId,
       newMessage:newMessage,
       sender:message.Sender
      });
    }

    res.status(200).json({ message: "Message edited successfully", data: message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Function to delete a specific message
const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  try {
    const message = await Message.findById(messageId);

    if (!message) throw new Error("Message not found");

    if (message.Sender.toString() !== userId && message.Receiver.toString() !== userId) {
      throw new Error("Unauthorized action");
    }

    message.DeletedFor.push(userId);
    await message.save();

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Function to delete all chat between two users
const deleteAllChat = async (req, res) => {
  const { receiverId } = req.params;
  const userId = req.user.id;

  try {
    const messages = await Message.updateMany(
      {
        $or: [
          { Sender: userId, Receiver: receiverId },
          { Sender: receiverId, Receiver: userId },
        ],
      },
      { $addToSet: { DeletedFor: userId } }
    );

    const sender = await User.findById(userId)
    sender.chats = sender.chats.filter(itm => itm.chatsWith.toString() !== receiverId);

    await sender.save()

    res.status(200).json({ message: "All chat deleted successfully", count: messages.nModified });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Function to fetch messages between two users
const getMessages = async (req, res) => {
  const { receiverId } = req.params;
  const userId = req.user.id;

  try {
    const user = await User.findById(receiverId).select('_id friends name profile')
    if (!user) throw new Error('Cant get User')

    const check = user.friends.filter(data => data.toString() == userId)
    if (check.length <= 0) throw new Error('Cant get User as Friend')
    let messages = await Message.find({
      $or: [
        { Sender: userId, Receiver: receiverId, DeletedFor: { $ne: userId } },
        { Sender: receiverId, Receiver: userId, DeletedFor: { $ne: userId } },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("Sender", "_id name profile")
      .populate("Receiver", "_id name profile");

    res.status(200).json({ data: messages, user: user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChatData = async (req, res) => {
  const userId = req.user.id;
  try {
    const user = await User.findById(userId)
      .populate({
        path: "friends",
        select: "_id name profile",
      }).populate({
        path: 'chats',
        populate: {
          path: 'chatsWith',
          select: '_id name profile'
        }
      })

    if (!user) throw new Error("User Not Found");

    res.status(200).json({
      friends: user.friends,
      chats: user.chats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




module.exports = {
  getChatData,
  sendMessage,
  editMessage,
  deleteMessage,
  deleteAllChat,
  getMessages,
};
