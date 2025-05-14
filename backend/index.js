import express, { json } from "express";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();
import { ConnectToDb } from "./db/dbconnection.js";
import { User } from "./models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./authMiddleware/authMiddleware.js";
import { Chat } from "./models/chatModel.js";
import { Message } from "./models/messageModel.js";
import http from "http";
import {Server} from "socket.io"

const port = process.env.PORT;

// initializing an express intance
const app = express();
app.use(cors());
app.use(express.json());

// Creating raw HTTP server using app
const server = http.createServer(app)       

// Initializing a Websocket server via socket.io for real time communication
  // Socket.IO needs to hook into the low-level server to upgrade the connection from HTTP to WebSocket.
  const io = new Server(server, {             // Attaching Socket.IO to HTTP server
    cors : "*",           // accept request from everywhere for now
    pingTimeout : 60000     // time:60s -> time to wait before disconnecting the ws connection
  })


// Socket.io endpoints : for real time communication
io.on("connection", (socket) => {
  console.log("client connected!", socket.id);
  socket.send(`client connected! socket id : ${socket.id}`)

  // user join event
  socket.on("user-join", (user) => {
    if(!user) return;
    
    // joined user to a dedicated room for privated message or notification
    socket.join(user._id)
    console.log("User joined", user._id);
  })

  // user joined a chat 
  socket.on("join-chat", (chat) => {
    if(!chat) return;

    // join to a room  for 1-1 or group chat
    socket.join(chat._id)
    console.log("user joined chat room : ", chat._id);
  })


  //when a user sends a message 
  socket.on("send-message", (message) => {
    if(!message) return;
    
    // now as the message is recieved send it to all users in the room except the sender
    message.chat.users.forEach((user) => {
      if(user._id === message.sender._id ) return;
      else{
        console.log("message sent to other user !");
        
        socket.in(user._id).emit("message-recieved", message);
      }
    })
    
  })

})




//Express endpoints
  // signup endpoint
  app.post("/api/user/signup", async (req, res) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required!" });
      }

      const foundUsername = await User.findOne({ username });
      if (foundUsername) {
        return res.status(400).json({ message: "username already taken!" });
      }

      const foundemail = await User.findOne({ email });
      if (foundemail) {
        return res.status(400).json({ message: "email already registered!" });
      }

      const hashedPwd = await bcrypt.hash(password, 10);

      await User.create({
        username,
        email,
        password: hashedPwd,
      });

      return res.status(200).json({ message: "user registered successfully!" });
    } catch (error) {
      return res.status(500).json({ message: "Error registering user!", error });
    }
  });

  //signin endpoint
  app.post("/api/user/signin", async (req, res) => {

    try {
      const { email, password } = req.body;

      const foundUser = await User.findOne({ email });

      if (!foundUser) {
        return res
          .status(400)
          .json({ message: "User not found! Please Register." });
      }

      const isPwdCorrect = await bcrypt.compare(password, foundUser.password);

      if (!isPwdCorrect) {
        return res.status(400).json({ message: "Incorrect password!" });
      }

      // once validated sign user a jwt token

      const token = jwt.sign(
        {
          userId: foundUser._id,
        },
        process.env.JWT_SECRET
      );

      res.status(200).json({ message: "user signed In!", token });
    } catch (error) {
      return res.status(500).json({ message: "Error Signing In!", error });
    }
  });

  // fetch current user data
  app.get("/api/user", authMiddleware, async (req, res) => {
    try {
      const userId = req.userId;

      const foundUser = await User.findOne({ _id: userId });

      if (!foundUser) {
        return res.status(400).json({ message: "token invalid! please login." });
      }

      return res.status(200).json({ user: foundUser });
    } catch (error) {
      return res.status(500).json({ message: "Error fetching user data!" });
    }
  });

  // endpoint to search users
  app.get("/api/users", authMiddleware, async (req, res) => {
    
    try {
      //setting up keyword for mongoDb query, if query not provided defaults to empty -> giving all results
      const keyword = req.query.search
        ? {
            // It builds a MongoDB query using $regex with the "i" option (case-insensitive).
            $or: [
              { username: { $regex: req.query.search, $options: "i" } },
              { email: { $regex: req.query.search, $options: "i" } },
            ],
          }
        : {};

      const currentUser = req.userId;
      // return a list excluding the current logged in user
      const foundUsers = await User.find(keyword).find({
        _id: { $ne: currentUser },
      });

      return res.status(200).json({ users: foundUsers });
    } catch (error) {
      return res.status(500).json({ message: "Error fetching users!", error });
    }
  });

  // CHAT ROUTES
  // 1. check if a one-to-one chat exits if so return the existing chat, if not create a new chat and then return
  app.post("/api/chat", authMiddleware, async (req, res) => {
    try {
      const self = req.userId; // user logged in
      const user2 = req.body.userId; // user with whom to start chat with

      if (!user2) {
        return res.status(400).json({ message: "User Id required to start chat!" });
      }

      // check if chat already exists, if found
      let foundChat = await Chat.findOne({
        isGroupChat: false,
        $and: [
          { users: { $elemMatch: { $eq: self } } },
          { users: { $elemMatch: { $eq: user2 } } },
        ],
      })
        .populate("users", "-password") //n MongoDB, when we create a relationship between two documents (e.g., a chat has users), we typically store just the ObjectId reference of the related document.
        .populate("latestMessage"); //Calling .populate() replaces those ObjectIds with the full document data.

      // as latestMessage as a 'sender' field which further refs towards User doc,
      // so need to populate at one more depth
      foundChat = await User.populate(foundChat, {
        // telling to take reference from the User model to populate sender
        path: "latestMessage.sender",
        select: "username email",
      });

      //if chatroom exists return it
      if (foundChat !== null) {
        return res.status(200).json({ chat: foundChat });
      }

      // if not present, create a fresh chat and return
      const createdChat = await Chat.create({
        chatName: "sender",
        isGroupChat: false,
        users: [self, user2],
      });

      // again fetch chat data, populate with user details and return
      const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );

      // finally return the created chat
      return res.status(200).json({ chat: fullChat });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error accessing Chat Data!", error });
    }
  });

  // 2. getting list of all chats for the logged in user
  app.get("/api/chats", authMiddleware, async (req, res) => {
    // simply search through all the chats, the current user is a part of
    try {
      let chats = await Chat.find({
        users: { $elemMatch: { $eq: req.userId } },
      })
        .populate("users", "-password")
        .populate("latestMessage")
        .populate("groupAdmin", "-password")
        .sort({ updatedAt: -1 }); // sort acc to latest 1st

      const allChats = await User.populate(chats, {
        path: "latestMessage.sender",
        select: "username email",
      });

      return res.status(200).json({ chats: allChats });
    } catch (error) {
      return res.status(500).json({ message: "Error fetching chats!", error });
    }
  });

  // 3. creating a group chat
  app.post("/api/create-group", authMiddleware, async (req, res) => {
    try {
      const { chatName, users } = req.body;

      const usersList = JSON.parse(users); // users will be stringified array of users
      if (usersList.length < 2) {
        return res
          .status(400)
          .json({ message: "Atleast two users are required to form a group!" });
      }
      usersList.push(req.userId);

      const createdGroup = await Chat.create({
        chatName,
        users: usersList,
        isGroupChat: true,
        groupAdmin: req.userId,
      });

      

      // find the created chat, and populate with users and admin details
      const groupDetails = await Chat.findOne({
        _id: createdGroup._id,
      })
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

      return res.status(200).json({ groupChat: groupDetails });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error creating group Chat!", error });
    }
  });

  // 4. renaming group
  app.put("/api/chat/rename", authMiddleware, async (req, res) => {
    try {
      // take chatId and new name from the body, update db
      const { newName, chatId } = req.body;

      const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
          chatName: newName,
        },
        { new: true }
      ) //to return the updated value
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

      if (!updatedChat) {
        return res.status(400).json({ message: "Chat not found!" });
      }

      return res
        .status(200)
        .json({ message: "Chat renamed successfully!", updatedChat });
    } catch (error) {
      return res.status(500).json({ message: "Error renaming Chat!", error });
    }
  });

  // 5. adding someone to the group
  app.post("/api/chat/add-user", authMiddleware, async (req, res) => {
    // get userId, and chatId from the body, find chat and push the user into the users array
    try {
      const { userId, chatId } = req.body;

      // check if user already exists in the chat
      const foundUser = await Chat.findOne({
        _id: chatId,
        users: { $in: [userId] },
      });
      if (foundUser) {
        return res
          .status(400)
          .json({ message: "User already exists in the group!" });
      }

      const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
          $push: { users: userId },
        },
        { new: true }
      )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

      if (!updatedChat) {
        return res.status(400).json({ message: "Chat not found!" });
      }

      return res
        .status(200)
        .json({ message: "user added successfully to chat!", updatedChat });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error adding user to chat!", error });
    }
  });

  // 6. removing somebody from the group
  app.post("/api/chat/remove-user", authMiddleware, async (req, res) => {
    // get userId, and chatId from the body, find chat and push the user into the users array
    try {
      const { userId, chatId } = req.body;

      // check if user already exists in the chat
      const foundUser = await Chat.findOne({
        _id: chatId,
        users: { $in: [userId] },
      });
      if (!foundUser) {
        return res
          .status(400)
          .json({ message: "User doesn't exist in the group!" });
      }

      const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
          $pull: { users: userId },
        },
        { new: true }
      )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

      if (!updatedChat) {
        return res.status(400).json({ message: "Chat not found!" });
      }

      return res
        .status(200)
        .json({
          message: "user removed successfully from the chat!",
          updatedChat,
        });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error adding user to chat!", error });
    }
  });

  // 7. sending message endpoint
  app.post("/api/chat/message", authMiddleware, async(req,res) => {

    try {
      const {chatId, message} = req.body;
      
      const createdMessage = await Message.create({
        sender : req.userId,
        content : message,
        chat : chatId
      })
    
      let fullMessage = await Message.findById(createdMessage._id)
                          .populate("sender", "username email")
                          .populate("chat")
      fullMessage = await User.populate(fullMessage,{
        path : "chat.users",
        select : "username email"
      })

      // update the chat's latest message 
      await Chat.findByIdAndUpdate(chatId,{
        latestMessage : createdMessage._id
      },{new:true})
    
      return res.status(200).json(fullMessage);
    } catch (error) {
      return res.status(500).json({message : "Error sending message!", error});
    }
      
  })
  // 8. get all messages for a given chat
  app.get("/api/chat/messages/:chatId", authMiddleware, async(req,res) => {
  try {
    
      const chatId = req.params.chatId
    
      // simply find all the messages which is a part of the given chat
      const messages = await Message.find({chat : chatId})
                        .populate("sender", "username email avatar")
                        .populate("chat")
    
      res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({message : "Error fetching messsages!"});
  }
    
  })

ConnectToDb()
  .then(() => {
    server.listen(port, () => {
      console.log("Server listening on port ", port);
    });
  })
  .catch(() => {
    console.error("Error connecting to DB!");
  });
