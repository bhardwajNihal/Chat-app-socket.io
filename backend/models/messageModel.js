import mongoose from "mongoose";

// schema for the chat messages

const messageSchema = mongoose.Schema({
    sender : {type: mongoose.Schema.Types.ObjectId, ref:"User"},
    content : {type : String, required : true},
    chatRoom : {type:mongoose.Schema.Types.ObjectId, ref: "ChatRoom"}
},{timestamps: true})

export const Message = mongoose.model("Message", messageSchema)