import express from "express";
import dotenv from "dotenv";
import cors from "cors"
import { messages } from "./data/messages.js";
dotenv.config();

const app = express();
const port = process.env.PORT;
app.use(cors());

app.get("/", (req,res) => {
    res.send("hello from the Server")
})

app.get("/messages", (req,res) => {
    res.json(messages);
})

app.listen(port, ()=>{
    console.log("Server listening on port ",port);
})