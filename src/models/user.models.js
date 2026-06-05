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
    coverimage: {
            type: String, // cloudinary url
        },
    watchhistory:[{
        type:Schema.Types.ObjectId,
        ref:"video"
    }],
    password:{
        type:String,
        required:[true,'password is req']
    },
    refreshtoken:{
        type:String
    }
},
{
    timestamps:true
})
userschema.pre("save",async function () {
    if(!this.isModified("password")) return ;
    this.password=  await bcrypt.hash(this.password,10)
    next();
})

userschema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
} 

userschema.methods.generateaccesstoken= function(){
   return jwt.sign(
        {
            _id: this._id,
            email:this.email,
            name:this.name,
            fullname:this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
    }
    )
}
userschema.methods.generaterefreshtoken= function(){
     return jwt.sign(
        {
            _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
    }
    )
}
export const User =  mongoose.model("User",userschema) 