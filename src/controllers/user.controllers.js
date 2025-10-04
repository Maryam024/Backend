import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from '../models/user.models.js';
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiReponse.js"

const registerUser = asyncHandler(async (req, res) => {
   const { fullName, email, username, password } = req.body
   console.log(fullName, email, username, password);

   if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
      throw new ApiError(400, "All fields are required!")
   }

   const existedUser = User.findOne({
      $or: [{ username }, { email }]
   })
   if (existedUser) {
      throw new ApiError(409, "Username or email already taken")
   }

   const avatarLocalPath = req.files?.avatar[0]?.path
   const coverImageLocalPath = req.files?.coverImage?.[0]?.path

   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar is required")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if (!avatar) {
      throw new ApiError(400, "Avatar is required")
   }
   const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase()
   })

   const createUser = await User.findById(user._id).
   select( "-password -refreshTokens")

   if(!createUser){
      throw new ApiError(500, "something went wrong while registring the user")
   }
   
   return res.status(202).json(
         new ApiResponse(200, createUser, "User registered successfully" )
   )
})
export { registerUser }