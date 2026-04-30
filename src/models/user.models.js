import mongoose , {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
const userschema = new Schema({ 
    username:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index:true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullname:{
        type: String,
        required: true,
        trim: true,
        index:true
    },
    avatar:{
        type:String,
        required:true
    },
    watchhistory:[{
        type:Schema.Types.ObjectId,
        ref:"video"
    }],
    password:{
        type:String,
        required:[true,'password is req']
    },
    refreshtokens:{
        type:String
    }
},
{
    timestamps:true
})
userschema.pre("save",async function (next) {
    if(!this.isModified("password")) return next();
    this.password=bcrypt.hash(this.password,10)
    next()
})

userschema.method.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(paasword,this.paasword)
}
export const User =  mongoose.model("User",userschema)