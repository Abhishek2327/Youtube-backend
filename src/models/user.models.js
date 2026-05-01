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

userschema.method.generteaccesstoken= function(){
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
userschema.method.genertefrefreshtoken= function(){
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