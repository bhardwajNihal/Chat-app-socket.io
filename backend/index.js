import express from "express";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();
import { ConnectToDb } from "./db/dbconnection.js";
import { User } from "./models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./authMiddleware/authMiddleware.js";
import { Chat } from "./models/chatModel.js";

const app = express();
const port = process.env.PORT;
app.use(cors());
app.use(express.json());

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

    res.json({ message: "user signed In!", token });
  } catch (error) {
    return res.status(500).json({ message: "Error Signing In!", error });
  }
});

// endpoint to search users
app.get("/api/user", authMiddleware, async (req, res) => {
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
app.post("api/chat-room", authMiddleware, async (req, res) => {
  try {
    const self = req.userId; // user logged in
    const user2 = req.body.userId; // user with whom to start chat with

    if (!user2) {
      return res.status(400).json({ message: "User Id required start chat!" });
    }

    // check if chat already exists, if found
    const foundChat = await Chat.findOne({
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
    if (foundChat.lenght > 0) {
      return res.status(200).json({ chat: foundChat[0] });
    }

    // if not present, create a fresh chat and return
    const createdChat = await Chat.create({
      chatRoomName: "sender",
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

// 2. getting list of all chats for a userId
// 3. creating group
// 4. renaming group
// 5. adding someone to the group
// 6. removing somebody from the group

ConnectToDb()
  .then(() => {
    app.listen(port, () => {
      console.log("Server listening on port ", port);
    });
  })
  .catch(() => {
    console.error("Error connecting to DB!");
  });
