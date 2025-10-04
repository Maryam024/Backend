import dotenv from 'dotenv'
import dbConnect from './db/index.js'
import { app } from './app.js'

dotenv.config({ path: './.env' })

dbConnect()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server started on port ${process.env.PORT}`)
    })
  })
  .catch((err) => console.error("Error in db connection", err))


/*
import mongoose from "mongoose";
import {db_name} from "./constants";
import express from "express"

const app = express()

;(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGO_URL}/${db_name}`)
        app.on("error", (err)=>{
            console.error("Error in server", err)
            throw err 
        })
        app.listen(process.env.PORT, ()=>{
            console.log(`Server started on port ${process.env.PORT}`)
        })
    } catch (error) {
        console.error(error);
    }
})
    */