import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// middleware to authenticate each request, based on token

export async function authMiddleware(req,res,next){

    try {
        const header = req.headers.authorization;
        const token = header.split(" ")[1];
    
        // verify token against secret
        const tokenDecoded = jwt.verify(token,process.env.JWT_SECRET);
    
        if(!tokenDecoded){
            return res.status(400).json({message : "token invalid! Please login."})
        }
    
        // if successfully verified attach the decoded userId to the req object
    
        req.userId = tokenDecoded.userId

        next()

    } catch (error) {
        return res.status(500).json({message: "Error authenticating request!"})
    }
}