//import('dotenv').config({path: './env' })
import dotenv from "dotenv"
import {app} from './app.js'
 
import connectdb from "./db/index.js";

 dotenv.config({
    path: './env'
 })

connectdb()

.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`server is running on port:${process.env.PORT}`)
    })
})

.catch((err)=>{
    console.log("error in connection of db",err)
})
















/*
import mogoose, { connect } from "mongoose"
import { DB_NAME } from "./constants";
import express from "express"
const app=express()

;(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error" , (error)=>{
            console.error("errr",error)
            throw error
        })

         app.listen(process.env.PORT,()=>{
            console.log(`app is listening oon port:${process.env.PORT}`);
         })
        
    } catch (error) {
        console.error("ERROR:",error)
        throw error
    }
})()
*/