 import { asyncHandler } from "../utils/asyncHandler.js";
 import {ApiError} from "../utils/ApiError.js"
 import { User } from "../models/user.models.js";
 import {uploadcloudinary} from "../utils/cloudinary.js"
 import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessandrefreshToken = async(userId)=>{
     try {
          const user = await user.findById(userId)
          const accesstoken = user.generateaccesstoken()
          const refreshtoken= user.generaterefreshtoken()

          user.refreshtoken = refreshtoken
          await user.save({validateBeforeSave:false})
          return {accesstoken , refreshtoken}
     } catch (error) {
          throw new ApiError(500 , "something went wrong during generating access and refresh tokens")
     }
}


 const registeruser= asyncHandler(async(req,res)=>{
       // get user details from frontend
       // validation - non empty 
       // check if already that user exists:username, email
       // check for images and avatar
       // upload them to cloudinary , avatar
       // create user object - create entry in db 
       // remove pass and refresh token field from response 
       // check for user creation 
       // return res  
    

       const {fullname , email , username , password}= req.body
       console.log("email" , email);
       /* so we can use multiple if conditions for various attributes
            if(fullname== ""){
            throw new ApiError(400, "fullname is req")
       }*/
       if([fullname,email,username,password].some((field)=>field?.trim()==="")){
            throw new ApiError(400, "all fields are required")
       }


       const existeduser= await User.findOne({
            $or:[{email},{username}]
       })

       if(existeduser){
            throw new ApiError(409,"user with this email or username already exists")
       }

       const avatarLocalPath= req.files?.avatar?.[0]?.path ;
       //const coverimageLocalPath= req.files?.coverimage?.[0]?.path;
       let coverimageLocalPath;
       if (req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0) {
        coverimageLocalPath = req.files.coverimage[0].path
       }
       console.log("FILES:", req.files);
       if(!avatarLocalPath){
            throw new ApiError(400, "avatar required")
       }

       const avatar= await uploadcloudinary(avatarLocalPath)
       const coverimage= await uploadcloudinary(coverimageLocalPath)
        
       if(!avatar){
            throw new ApiError(400, "avatar is req")
       }
       const user= await User.create({
            fullname,
            avatar: avatar.url,
            coverimage: coverimage?.url||"",
            email,
            password,
            username:username.toLowerCase()
       })

       const createduser= await User.findById(user._id).select(
            "-password -refreshtokens"
       )
       if(!createduser){
            throw new ApiError(500, "something went wrong while registering user")
       }


       return res.status(201).json(
            new ApiResponse(200, createduser,"user registered successfully")
       )
 })
const loginuser = asyncHandler(async(req,res)=>{
 const {email , username , password}= req.body

if(!username || !email){
     throw new ApiError(400, "username or email is required")
}
const user =await User.findOne({
     $or: [{username},{email}]
})

if(!user){
     throw new ApiError(404, "user does not exist")
}
const ispasswordvalid = await user.isPasswordCorrect(password)
if(!ispasswordvalid){
     throw new ApiError(401,"password is invalid")
}

 const {accesstoken,refreshtoken}=await generateAccessandrefreshToken(user._id)
 const loggedinuser = await User.findById(user._id).select("-password -refreshtoken")

 const options= {
     httpOnly : true,
     secure: true
 }

return res
.status(200)
.cookie("accesstoken",accesstoken,options)
.cookie("refreshtoken",refreshtoken,options)
.json(
     new ApiResponse(200),
     {
          user:loggedinuser,accesstoken,refreshtoken
     },
     "successfully logged in"
)

 })

const logoutuser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

export {registeruser, loginuser,logoutuser}