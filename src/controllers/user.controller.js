 import { asyncHandler } from "../utils/asyncHandler.js";
 import {ApiError} from "../utils/ApiError.js"
 import { User } from "../models/user.models.js";
 import {uploadcloudinary} from "../utils/cloudinary.js"
 import { ApiResponse } from "../utils/ApiResponse.js";
import jwt, { verify } from "jsonwebtoken"
import { JsonWebTokenError } from "jsonwebtoken";

const generateAccessandrefreshToken = async(userId)=>{
     try {
          const user = await User.findById(userId)
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

if(!(username || email)){
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
    .clearCookie("accesstoken", options)
    .clearCookie("refreshtoken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})



const refreshAccesstoken= asyncHandler(async(req,res)=>{
    const incomingRefreshToken=  req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
     throw new ApiError(401, "unauthorized request")
    }

    try {
     const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
     )
 
     const user= await user.findById(decodedToken?._id)
 
     if(!user){ 
      throw new ApiError(401, "invalid refreshToken")
     }
 
     if(incomingRefreshToken != user?.refreshtoken){
      throw new ApiError(401, "refresh token is expired or used" )
     }
 
     const options= {
      httpOnly: true,
      select: true
     }
 
     const {accesstoken,newrefreshtoken}=await generateAccessandrefreshToken(user._id)
 
     return res
     .status(200)
     .cookie("accesstoken",accesstoken,options)
     .cookie("refreshtoke",newrefreshtoken,options)
     .json(
      new ApiResponse(
           200,
           {accesstoken,refreshtoken: newrefreshtoken },
           "access token refreshed"
      )
     )
    } catch (error) {
     throw new ApiError(401, error?.message || "invalid refesh token")
    }
})



const changecurrentpassword= asyncHandler(async(refreshAccesstoken,res)=>{
     const {oldpassword , newpassword} = req.body

     const user= await User.findById(req.user?._id)
     const isPasswordCorrect = await user.isPasswordCorrect(oldpassword)
     if(!isPasswordCorrect){
          throw new ApiError(400, "invalid old password")
     }

     user.password= newpassword
     await user.save({validateBeforeSave:false})

     return res
     .statu(200)
     .json(new ApiResponse(200, {}, "password changed successfully"))
})



const getcurrentuser = asyncHandler(async(req,res)=>{
     return res
     .status(200) 
     .json(200, req.user,"curreny user fetched successfully")
})



const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullname, email} = req.body

    if (!fullname || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});



const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})



const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverimage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})



const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverimage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})





export {registeruser, loginuser,logoutuser,refreshAccesstoken,
     changecurrentpassword,getcurrentuser,updateAccountDetails,
     updateUserAvatar , updateUserCoverImage,getUserChannelProfile}