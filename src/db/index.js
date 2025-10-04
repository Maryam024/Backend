import mongoose from "mongoose";
import {db_name} from '../constants.js';

const dbConnect = async()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URL}/${db_name}`)
        console.log(`/n MongoDB connected successfully ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.error("Error connecting to database", error)
        process.exit(1)
    }
}

export default dbConnect;