import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from '../models/user.models.js';
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiReponse.js"
import jwt from 'jsonwebtoken'

const generateAccessAndRefreshTokens = async (userID) => {
   try {
      const user = await User.findById(userID)
      const refreshToken = user.generateRefreshTokens()
      const accessToken = user.generateAccessTokens()
      user.refreshTokens = refreshToken
      await user.save({ validateBeforeSave: false })

      return { accessToken, refreshToken }

   } catch (error) {
      throw new ApiError(500, "something went wrong while generating access and refresh tokens")
   }
}

const registerUser = asyncHandler(async (req, res) => {
   const { fullName, email, username, password } = req.body
   console.log(fullName, email, username, password);

   if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
      throw new ApiError(400, "All fields are required!")
   }

   const existedUser = await User.findOne({
      $or: [{ username }, { email }]
   })
   if (existedUser) {
      throw new ApiError(409, "Username or email already taken")
   }

   const avatarLocalPath = req.files?.avatar[0]?.path
   let coverImageLocalPath;
   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path
   }
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
      select("-password -refreshTokens")

   if (!createUser) {
      throw new ApiError(500, "something went wrong while registring the user")
   }

   return res.status(202).json(
      new ApiResponse(200, createUser, "User registered successfully")
   )
})

const loginUser = asyncHandler(async (req, res) => {
   const { username, email, password } = req.body

   if (!(username || email)) {
      throw new ApiError(400, "username or email is required")
   }
   const user = await User.findOne({
      $or: [{ username }, { email }]
   })
   if (!user) {
      throw new ApiError(404, "User not found")
   }
   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
      throw new ApiError(402, "invalid credentials!")
   }
   const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

   const loggedIn = await User.findById(user._id).select("-password -refreshTokens")

   const options = {
      httpOnly: true,
      secure: true
   }

   return res.status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
         new ApiResponse(
            200,
            {
               user: loggedIn, refreshToken, accessToken
            },
            "User logged in successfully"
         )
      )
})

const logoutUser = asyncHandler(async (req, res) => {
   await User.findByIdAndUpdate(
      req.user._id,
      {
         $set: {
            refreshTokens: undefined
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
   return res.status(202)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(
         new ApiResponse(
            202, {}, "User logged Out"
         )
      )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
   try {
      const incomingRefreshToken = await req.cookies?.refreshToken || req.body.refreshToken
      if (!incomingRefreshToken) {
         throw new ApiError(401, "Invalid refrwsh token")
      }

      const decoded = jwt.verify(incomingRefreshToken, process.env.REFRSH_TOKEN_SECRET)

      const user = await User.findById(decoded?._id)

      if (!user) {
         throw new ApiError(401, "Invalid refrwsh token")
      }

      if (incomingRefreshToken !== user?.refreshTokens) {
         throw new ApiError(402, "Refresh token is expired or used")
      }

      const options = {
         httpOnly: true,
         secure: true
      }

      const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

      return res.status(200)
         .cookie("accessToken", accessToken, options)
         .cookie("refreshToken", newRefreshToken, options)
         .json(
            new ApiResponse(
               200,
               {
                  accessToken, refreshToken: newRefreshToken
               },
               "Access Token Refreshed"
            )
         )
   } catch (error) {
      throw new ApiError(400, error?.message || "Invalid refresh token")
   }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
   const { oldPassword, newPassword } = req.body

   const user = await User.findById(req.user?._id)
   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

   if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid old password")
   }
   user.password = newPassword
   user.save({ validateBeforeSave: false })

   return res.status(200)
      .json(
         new ApiResponse(
            200,
            {
            }, "Password changed successfully"
         )
      )
})

const getCurrentUser = asyncHandler(async (req, res) => {
   return res.status(200)
      .json(200, req.user, "current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async (req, res) => {
   const { fullName, email } = req.body
   if (!fullName || !email) {
      throw new ApiError(400, "all fields are required")
   }
   const user = await User.findByIdAndUpdate(req.user?._id,
      {
         $set: {
            email, fullName
         }
      },
      { new: true }
   ).select('-password')

   return res.status(200)
      .json(
         new ApiResponse(200,
            user, "User details updated successfully"
         )
      )
})
const updateUserAvatar = asyncHandler(async (req, res) => {
   const avatarLocalPath = req.file?.path

   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is missing")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if (!avatar.url) {
      throw new ApiError(400, "error while uploading or avatar")
   }

   const user = await User.findByIdAndUpdate((req.user?._id),
      {
         $set: {
            avatar: avatar.url
         }
      }, { new: true }).select('-password')

   return res.status(200).json(
      new ApiResponse(200, user ,"avatar image is updated successfully"
      )
   )
})
const updateCoverImage = asyncHandler(async (req, res) => {
   const coverImageLocalPath = req.file?.path

   if (!coverImageLocalPath) {
      throw new ApiError(400, "cover image is missing")
   }

   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if (!coverImage.url) {
      throw new ApiError(400, "error while uploading cover image")
   }

   const user = await User.findByIdAndUpdate((req.user?._id),
      {
         $set: {
            coverImage: coverImage.url
         }
      }, { new: true }).select('-password')

      return res.status(200).json(
      new ApiResponse(200, user ,"cover image is updated successfully"
      )
   )
}
)
export {
   registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateCoverImage
}