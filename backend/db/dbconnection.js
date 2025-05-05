import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config()

export async function ConnectToDb() {
    
    try {
        
        const connectionInstance = await mongoose.connect(process.env.DB_URL);
        console.log("Db connected successfully : ",connectionInstance.connection.host);
        

    } catch (error) {
        console.error("Error connecting to DB!", error);
        process.exit(1);
    }
}
