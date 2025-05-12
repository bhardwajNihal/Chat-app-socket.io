import mongoose from "mongoose";

// schema for the chat messages

const messageSchema = mongoose.Schema({
    sender : {type: mongoose.Schema.Types.ObjectId, ref:"User"},
    content : {type : String, required : true},
    chat : {type:mongoose.Schema.Types.ObjectId, ref: "Chat"}
},{timestamps: true})

export const Message = mongoose.model("Message", messageSchema)