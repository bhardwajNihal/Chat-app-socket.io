
import mongoose from "mongoose";

// schema for the chatroom

const chatSchema = mongoose.Schema({
  chatName: { type: String, required: true },
  isGroupChat: { type: Boolean, default: false },
  users: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  latestMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
},{timestamps:true});

export const Chat = mongoose.model("Chat", chatSchema);
