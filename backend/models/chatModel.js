
import mongoose from "mongoose";

// schema for the chatroom

const chatRoomSchema = mongoose.Schema({
  chatRoomName: { type: String, required: true },
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

export const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);
