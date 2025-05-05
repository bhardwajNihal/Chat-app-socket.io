import mongoose from "mongoose";

const userSchema = mongoose.model({
    username : {type:String, required:true, unique:true},
    email : {type:String, required:true, unique:true},
    password : {type:String, required:true},
    avatar : {type:String, required:true, default:"https://imgs.search.brave.com/X7XPq0yunGvlrkH7gP12GzAcbLpgJ9-xhHWwA9RtyRQ/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzA2LzMzLzU0Lzc4/LzM2MF9GXzYzMzU0/Nzg0Ml9BdWdZemV4/VHBNSjl6MVljcFRL/VUJvcUJGMENVQ2sx/MC5qcGc"}
},{timestamps:true})

export const User = mongoose.model("User", userSchema);